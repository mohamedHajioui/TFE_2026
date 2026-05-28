import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Order,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from './entity/order.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../products/entity/product.entity';
import { Menu } from '../menus/entity/menu.entity';
import { User } from '../users/entity/user.entity';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  GuestAddressDto,
} from './dto/create-order.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { Address } from '../adress/entity/address.entity';
import { SettingsService } from '../settings/settings.service';
import { SETTING_KEYS } from '../settings/entity/setting.entity';
import { NotificationService } from '../../common/services/notification.service';
import { calculateDeliveryFee } from '../../common/utils/delivery.util';
import { IngredientService } from '../ingredients/ingredient.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Menu) private readonly menuRepository: Repository<Menu>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly settingsService: SettingsService,
    private readonly notificationService: NotificationService,
    private readonly ingredientService: IngredientService,
  ) {}

  /* Utilitaires */

  /** Format: CMD-YYYYMMDD-XXX */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `CMD-${today}-%` })
      .getCount();
    const sequence = String(count + 1).padStart(3, '0');
    return `CMD-${today}-${sequence}`;
  }

  /* ESTIMATION LIVRAISON (public) */

  estimateDelivery(
    lat: number,
    lng: number,
  ): {
    fee: number;
    distanceKm: number;
    outOfRange: boolean;
    label: string;
  } {
    const result = calculateDeliveryFee(lat, lng);
    const label = result.outOfRange
      ? `Hors zone (max 10 km)`
      : result.fee === 0
        ? 'Gratuit'
        : `${result.fee.toFixed(2)} €`;
    return { ...result, label };
  }

  /* CRÉATION — USER CONNECTÉ */

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Livraison autorisée ?
    if (dto.type === OrderType.DELIVERY) {
      await this.assertDeliveryEnabled();
      if (!dto.deliveryAddressId) {
        throw new BadRequestException(
          'Une adresse de livraison est requise pour une commande en livraison',
        );
      }
    }

    // Créneau
    const timeSlot = await this.resolveAndCheckTimeSlot(dto.timeSlotId);

    // Adresse (user connecté)
    let deliveryAddress: Address | null = null;
    if (dto.deliveryAddressId) {
      deliveryAddress = await this.addressRepository.findOne({
        where: { id: dto.deliveryAddressId },
        relations: ['user'],
      });
      if (!deliveryAddress) throw new NotFoundException('Adresse introuvable');
      if (deliveryAddress.user?.id !== userId) {
        throw new ForbiddenException("Cette adresse n'est pas la vôtre");
      }
    }

    // Items
    const { items, subtotal } = await this.buildItems(dto.items);

    // Delivery fee calculé côté backend à partir des coordonnées GPS
    // Le frontend envoie lat/lng, le backend décide du prix — non falsifiable
    let deliveryFee = 0;
    if (dto.type === OrderType.DELIVERY) {
      if (dto.customerLat && dto.customerLng) {
        const result = calculateDeliveryFee(dto.customerLat, dto.customerLng);
        if (result.outOfRange) {
          throw new BadRequestException(
            `Adresse hors zone de livraison (${result.distanceKm.toFixed(1)} km). Maximum ${10} km.`,
          );
        }
        deliveryFee = result.fee;
      } else {
        // Fallback si pas de coords (adresse existante sans coords)
        deliveryFee = await this.settingsService.getNumber(
          SETTING_KEYS.DELIVERY_FEE,
          3.5,
        );
      }
    }
    const total = subtotal + deliveryFee;

    // Commande (PENDING / PENDING, pas de réservation créneau)
    const orderNumber = await this.generateOrderNumber();
    const order = this.orderRepository.create({
      orderNumber,
      user,
      type: dto.type,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timeSlot,
      deliveryAddress: deliveryAddress ?? undefined,
      subtotal,
      deliveryFee,
      total,
      customerNote: dto.customerNote ?? null,
    } as Partial<Order>);

    const saved = await this.orderRepository.save(order);

    for (const item of items) {
      item.order = saved as Order;
      await this.orderItemRepository.save(item);
    }

    return await this.findOne((saved as Order).id, userId);
  }

  /* CRÉATION — INVITÉ */

  async createGuest(dto: CreateOrderDto): Promise<Order> {
    if (!dto.guest) {
      throw new BadRequestException(
        'Informations invité requises (email, nom, téléphone)',
      );
    }

    if (dto.type === OrderType.DELIVERY) {
      await this.assertDeliveryEnabled();
      if (!dto.guestAddress) {
        throw new BadRequestException(
          'Adresse de livraison requise pour une commande invité en livraison',
        );
      }
    }

    const timeSlot = await this.resolveAndCheckTimeSlot(dto.timeSlotId);

    const { items, subtotal } = await this.buildItems(dto.items);

    // Delivery fee calculé côté backend à partir des coordonnées GPS
    let deliveryFee = 0;
    if (dto.type === OrderType.DELIVERY) {
      if (dto.customerLat && dto.customerLng) {
        const result = calculateDeliveryFee(dto.customerLat, dto.customerLng);
        if (result.outOfRange) {
          throw new BadRequestException(
            `Adresse hors zone de livraison (${result.distanceKm.toFixed(1)} km). Maximum ${10} km.`,
          );
        }
        deliveryFee = result.fee;
      } else {
        deliveryFee = await this.settingsService.getNumber(
          SETTING_KEYS.DELIVERY_FEE,
          3.5,
        );
      }
    }
    const total = subtotal + deliveryFee;

    const orderNumber = await this.generateOrderNumber();

    const order = this.orderRepository.create({
      orderNumber,
      user: null,
      type: dto.type,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timeSlot,
      deliveryAddress: null,
      subtotal,
      deliveryFee,
      total,
      customerNote: dto.customerNote ?? null,
      // Infos invité
      guestToken: randomUUID(),
      guestEmail: dto.guest.email,
      guestName: dto.guest.name,
      guestPhone: dto.guest.phone,
      // Adresse inline (si DELIVERY)
      ...(dto.guestAddress ? this.flattenGuestAddress(dto.guestAddress) : {}),
    } as Partial<Order>);

    const saved = await this.orderRepository.save(order);

    for (const item of items) {
      item.order = saved as Order;
      await this.orderItemRepository.save(item);
    }

    return await this.findOneById((saved as Order).id);
  }

  private flattenGuestAddress(addr: GuestAddressDto): Partial<Order> {
    return {
      guestStreet: addr.street,
      guestNumber: addr.number,
      guestBox: addr.box ?? null,
      guestPostalCode: addr.postalCode,
      guestCity: addr.city,
      guestCountry: addr.country ?? 'Belgium',
      guestAddressComplement: addr.complement ?? null,
    };
  }

  /* Helpers partagés */

  private async assertDeliveryEnabled(): Promise<void> {
    const enabled = await this.settingsService.getBool(
      SETTING_KEYS.DELIVERY_ENABLED,
      true,
    );
    if (!enabled) {
      throw new BadRequestException(
        'Les livraisons sont temporairement désactivées. Choisissez un retrait en boutique.',
      );
    }
  }

  private async resolveAndCheckTimeSlot(timeSlotId: number): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findOne({
      where: { id: timeSlotId },
    });
    if (!slot) throw new NotFoundException('Créneau horaire introuvable');
    if (!slot.isAvailable) {
      throw new BadRequestException("Ce créneau n'est pas disponible");
    }
    if (slot.currentBookings >= slot.maxCapacity) {
      throw new BadRequestException('Ce créneau est complet');
    }
    return slot;
  }

  private async buildItems(
    itemsDto: CreateOrderItemDto[],
  ): Promise<{ items: OrderItem[]; subtotal: number }> {
    const items: OrderItem[] = [];
    let subtotal = 0;
    for (const dto of itemsDto) {
      const item = await this.buildOrderItem(dto);
      subtotal += Number(item.totalPrice);
      items.push(item);
    }
    return { items, subtotal };
  }

  private async buildOrderItem(dto: CreateOrderItemDto): Promise<OrderItem> {
    if (dto.itemType === 'product') return this.buildProductOrderItem(dto);
    if (dto.itemType === 'menu') return this.buildMenuOrderItem(dto);
    throw new BadRequestException(`itemType inconnu : ${String(dto.itemType)}`);
  }

  private async buildProductOrderItem(
    dto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    if (!dto.productId) throw new BadRequestException('productId requis');

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
      relations: ['productIngredients', 'productIngredients.ingredient'],
    });
    if (!product)
      throw new NotFoundException(`Produit #${dto.productId} introuvable`);
    if (!product.isActive) {
      throw new BadRequestException(
        `Le produit "${product.name}" n'est plus disponible`,
      );
    }

    const removedIds = new Set(dto.customization?.removed ?? []);
    const extraIds = new Set(dto.customization?.extra ?? []);

    for (const pi of product.productIngredients ?? []) {
      const ing = pi.ingredient;
      if (!ing) continue;

      if (pi.isRequired && !removedIds.has(ing.id)) {
        const needed = Number(pi.quantity) * dto.quantity;
        if (!ing.isAvailable || Number(ing.currentStock) < needed) {
          throw new BadRequestException(
            `Stock insuffisant pour "${ing.name}" (besoin : ${needed} ${ing.unit}, dispo : ${Number(ing.currentStock)} ${ing.unit})`,
          );
        }
      }

      if (extraIds.has(ing.id)) {
        if (!ing.isAvailable) {
          throw new BadRequestException(
            `Le supplément "${ing.name}" n'est plus disponible`,
          );
        }
        const needed = Number(pi.quantity) * dto.quantity;
        if (Number(ing.currentStock) < needed) {
          throw new BadRequestException(
            `Stock insuffisant pour le supplément "${ing.name}" (besoin : ${needed} ${ing.unit}, dispo : ${Number(ing.currentStock)} ${ing.unit})`,
          );
        }
      }
    }

    let unitPrice = Number(product.basePrice);
    if (dto.customization?.extra) {
      for (const ingredientId of dto.customization.extra) {
        const pi = product.productIngredients.find(
          (p) => p.ingredient.id === ingredientId,
        );
        if (pi?.extraPrice) unitPrice += Number(pi.extraPrice);
      }
    }
    const totalPrice = unitPrice * dto.quantity;

    return this.orderItemRepository.create({
      itemType: 'product',
      product,
      menu: null,
      menuChoices: null,
      quantity: dto.quantity,
      unitPrice,
      totalPrice,
      customization: dto.customization ?? null,
      specialInstructions: dto.specialInstructions ?? null,
    } as Partial<OrderItem>);
  }

  private async buildMenuOrderItem(
    dto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    if (!dto.menuId) throw new BadRequestException('menuId requis');

    const menu = await this.menuRepository.findOne({
      where: { id: dto.menuId },
      relations: ['allowedProducts'],
    });
    if (!menu) throw new NotFoundException(`Menu #${dto.menuId} introuvable`);
    if (!menu.isActive) {
      throw new BadRequestException(
        `Le menu "${menu.name}" n'est plus disponible`,
      );
    }

    if (dto.menuChoices) {
      const allowedIds = menu.allowedProducts?.map((p) => p.id) ?? [];
      const chosenProductIds: number[] = [];

      for (const [role, id] of Object.entries(dto.menuChoices)) {
        if (!id) continue;
        if (!allowedIds.includes(id)) {
          throw new BadRequestException(
            `Produit #${id} (${role}) ne fait pas partie du menu "${menu.name}"`,
          );
        }
        chosenProductIds.push(id);
      }

      if (chosenProductIds.length > 0) {
        const chosenProducts = await this.productRepository.find({
          where: { id: In(chosenProductIds) },
          relations: ['productIngredients', 'productIngredients.ingredient'],
        });

        for (const product of chosenProducts) {
          if (!product.isActive) {
            throw new BadRequestException(
              `Le produit "${product.name}" du menu n'est plus disponible`,
            );
          }

          for (const pi of product.productIngredients ?? []) {
            if (!pi.isRequired || !pi.ingredient) continue;
            const needed = Number(pi.quantity) * dto.quantity;
            if (!pi.ingredient.isAvailable || Number(pi.ingredient.currentStock) < needed) {
              throw new BadRequestException(
                `Stock insuffisant pour "${pi.ingredient.name}" dans le produit "${product.name}" du menu`,
              );
            }
          }
        }
      }
    }

    const unitPrice = Number(menu.price);
    const totalPrice = unitPrice * dto.quantity;

    return this.orderItemRepository.create({
      itemType: 'menu',
      product: null,
      menu,
      menuChoices: dto.menuChoices ?? null,
      quantity: dto.quantity,
      unitPrice,
      totalPrice,
      customization: null,
      specialInstructions: dto.specialInstructions ?? null,
    } as Partial<OrderItem>);
  }

  /* LECTURE */

  async findAll(
    queryDto: QueryOrderDto,
    userId?: number,
    onlyPaid = false,
  ): Promise<Order[]> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.timeSlot', 'timeSlot')
      .leftJoinAndSelect('order.deliveryAddress', 'deliveryAddress')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.menu', 'menu');

    if (userId) qb.andWhere('order.user.id = :userId', { userId });
    if (onlyPaid) {
      qb.andWhere('order.paymentStatus = :paidStatus', {
        paidStatus: PaymentStatus.PAID,
      });
    }
    if (queryDto.userId) {
      qb.andWhere('order.user.id = :filterUserId', {
        filterUserId: queryDto.userId,
      });
    }
    if (queryDto.status)
      qb.andWhere('order.status = :status', { status: queryDto.status });
    if (queryDto.type)
      qb.andWhere('order.type = :type', { type: queryDto.type });
    if (queryDto.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: queryDto.paymentStatus,
      });
    }
    if (queryDto.date)
      qb.andWhere('timeSlot.date = :date', { date: queryDto.date });

    qb.orderBy('order.createdAt', 'DESC');
    return await qb.getMany();
  }

  async findOne(id: number, userId?: number): Promise<Order> {
    const order = await this.findOneById(id);
    if (userId && order.user?.id !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette commande");
    }
    return order;
  }

  private async findOneById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'timeSlot',
        'deliveryAddress',
        'items',
        'items.product',
        'items.menu',
      ],
    });
    if (!order) throw new NotFoundException(`Commande #${id} introuvable`);
    return order;
  }

  async getMyOrders(userId: number): Promise<Order[]> {
    return await this.findAll({}, userId, false);
  }

  /* GUEST — dernière adresse */

  /**
   * Retourne la dernière adresse utilisée par un invité avec cet email.
   * Utilisé pour préremplir le formulaire lors d'une nouvelle commande.
   */
  async getLastGuestAddress(email: string, guestToken: string): Promise<{
    street: string | null;
    number: string | null;
    box: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    complement: string | null;
    name: string | null;
    phone: string | null;
  } | null> {
    const lastOrder = await this.orderRepository.findOne({
      where: { guestEmail: email, guestToken, type: OrderType.DELIVERY },
      order: { createdAt: 'DESC' },
    });
    if (!lastOrder) return null;
    if (!lastOrder.guestStreet) return null;

    return {
      street: lastOrder.guestStreet,
      number: lastOrder.guestNumber,
      box: lastOrder.guestBox,
      postalCode: lastOrder.guestPostalCode,
      city: lastOrder.guestCity,
      country: lastOrder.guestCountry,
      complement: lastOrder.guestAddressComplement,
      name: lastOrder.guestName,
      phone: lastOrder.guestPhone,
    };
  }

  /* MISE À JOUR DE STATUT (ADMIN/EMPLOYEE) */

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOneById(id);
    const previousStatus = order.status;

    order.status = dto.status;
    if (dto.internalNote) order.internalNote = dto.internalNote;
    if (dto.status === OrderStatus.COMPLETED) order.completedAt = new Date();

    // Libérer le créneau et restaurer le stock si annulation ET commande déjà payée
    if (
      dto.status === OrderStatus.CANCELLED &&
      order.paymentStatus === PaymentStatus.PAID
    ) {
      if (order.timeSlot) {
        const slot = await this.timeSlotRepository.findOne({
          where: { id: order.timeSlot.id },
        });
        if (slot && slot.currentBookings > 0) {
          slot.currentBookings -= 1;
          await this.timeSlotRepository.save(slot);
        }
      }

      // Restaurer le stock des ingrédients
      await this.ingredientService.restoreOrderStock(order.id);
    }

    const saved = await this.orderRepository.save(order);

    // Hook notification : CONFIRMED → IN_PREPARATION = "l'employé la prend"
    if (
      previousStatus === OrderStatus.CONFIRMED &&
      dto.status === OrderStatus.IN_PREPARATION
    ) {
      await this.notificationService.notifyOrderTakenInCharge(saved);
    }

    return saved;
  }

  /* ANNULATION CLIENT */

  async cancel(id: number, userId: number): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cette commande est déjà terminée');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cette commande est déjà annulée');
    }
    if (order.status === OrderStatus.IN_DELIVERY) {
      throw new BadRequestException(
        'Commande en cours de livraison, annulation impossible',
      );
    }
    if (
      order.paymentStatus === PaymentStatus.PAID &&
      order.status === OrderStatus.IN_PREPARATION
    ) {
      throw new BadRequestException(
        'Commande déjà en préparation, contactez la sandwicherie',
      );
    }

    return await this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      internalNote: 'Annulée par le client',
    });
  }

  /* COMMANDE MANUELLE (ADMIN/EMPLOYEE — client sur place) */

  async createManualOrder(
    staffUserId: number,
    dto: CreateManualOrderDto,
  ): Promise<Order> {
    // Items
    const { items, subtotal } = await this.buildItems(dto.items);

    // Commande directement PAID + CONFIRMED (paiement en caisse)
    // Pas de créneau : les commandes manuelles sont pour les clients sur place
    const orderNumber = await this.generateOrderNumber();
    const order = this.orderRepository.create({
      orderNumber,
      type: OrderType.PICKUP,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      customerNote: dto.customerNote ?? undefined,
      internalNote: `Commande manuelle par employé #${staffUserId}`,
    });
    // Pas de user (client sur place) ni de timeSlot (commande manuelle)
    order.user = null as any;
    order.timeSlot = null as any;

    const saved = await this.orderRepository.save(order);

    for (const item of items) {
      item.order = saved as Order;
      await this.orderItemRepository.save(item);
    }

    // Déduire le stock immédiatement
    await this.ingredientService.deductOrderStock((saved as Order).id);

    return await this.findOneById((saved as Order).id);
  }

  /* STATISTIQUES */

  async getStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedToday: number;
    revenueToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const totalOrders = await this.orderRepository.count({
      where: { paymentStatus: PaymentStatus.PAID },
    });

    const pendingOrders = await this.orderRepository.count({
      where: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      },
    });

    const completedToday = await this.orderRepository
      .createQueryBuilder('order')
      .where('DATE(order.completedAt) = :today', { today })
      .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
      .getCount();

    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'revenue')
      .where('DATE(order.completedAt) = :today', { today })
      .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.PAID,
      })
      .getRawOne<{ revenue: string | null }>();

    const revenueToday = parseFloat(revenueResult?.revenue ?? '0');

    return { totalOrders, pendingOrders, completedToday, revenueToday };
  }
}
