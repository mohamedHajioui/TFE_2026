import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, OrderType, PaymentStatus } from './entity/order.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../products/entity/product.entity';
import { User } from '../users/entity/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { Address } from '../adress/entity/address.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Générer un numéro de commande unique
   * Format: CMD-YYYYMMDD-XXX
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

    // Compter les commandes du jour
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `CMD-${today}-%` })
      .getCount();

    const sequence = String(count + 1).padStart(3, '0');
    return `CMD-${today}-${sequence}`;
  }

  /**
   * Créer une commande
   */
  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. Vérifier l'utilisateur
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // 2. Vérifier le créneau horaire
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { id: createOrderDto.timeSlotId },
    });

    if (!timeSlot) {
      throw new NotFoundException('Créneau horaire introuvable');
    }

    if (!timeSlot.isAvailable) {
      throw new BadRequestException("Ce créneau n'est pas disponible");
    }

    if (timeSlot.currentBookings >= timeSlot.maxCapacity) {
      throw new BadRequestException('Ce créneau est complet');
    }

    // 3. Vérifier l'adresse (si livraison)
    let deliveryAddress: Address | null = null;
    let deliveryFee = 0;

    if (createOrderDto.type === OrderType.DELIVERY) {
      if (!createOrderDto.deliveryAddressId) {
        throw new BadRequestException('Une adresse de livraison est requise pour une livraison');
      }

      deliveryAddress = await this.addressRepository.findOne({
        where: { id: createOrderDto.deliveryAddressId },
        relations: ['user'],
      });

      if (!deliveryAddress) {
        throw new NotFoundException('Adresse de livraison introuvable');
      }

      if (deliveryAddress.user.id !== userId) {
        throw new ForbiddenException('Cette adresse ne vous appartient pas');
      }

      // Frais de livraison (vous pouvez les calculer selon la distance)
      deliveryFee = 3.5; // Exemple: 3.50€ fixe
    }

    // 4. Vérifier et calculer les items
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemDto of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
        relations: ['productIngredients', 'productIngredients.ingredient'],
      });

      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${itemDto.productId} introuvable`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Le produit "${product.name}" n'est plus disponible`);
      }

      // Calculer le prix unitaire (basePrice + suppléments)
      let unitPrice = Number(product.basePrice);

      // Ajouter les suppléments (ingrédients extra)
      if (itemDto.customization?.extra) {
        for (const ingredientId of itemDto.customization.extra) {
          const productIngredient = product.productIngredients.find(
            (pi) => pi.ingredient.id === ingredientId,
          );

          if (productIngredient && productIngredient.extraPrice) {
            unitPrice += Number(productIngredient.extraPrice);
          }
        }
      }

      const totalPrice = unitPrice * itemDto.quantity;
      subtotal += totalPrice;

      // Créer l'OrderItem (pas encore sauvegardé)
      const orderItem = this.orderItemRepository.create({
        itemType: 'product',
        product,
        menu: null,
        menuChoices: null,
        quantity: itemDto.quantity,
        unitPrice,
        totalPrice,
        customization: itemDto.customization || null,
        specialInstructions: itemDto.specialInstructions || null,
      } as Partial<OrderItem>);

      orderItems.push(orderItem);
    }

    // 5. Créer la commande
    const orderNumber = await this.generateOrderNumber();
    const total = subtotal + deliveryFee;

    const order = this.orderRepository.create({
      orderNumber,
      user,
      type: createOrderDto.type,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timeSlot,
      deliveryAddress,
      subtotal,
      deliveryFee,
      total,
      customerNote: createOrderDto.customerNote || null,
    } as Partial<Order>);

    // 6. Sauvegarder la commande
    const savedOrder = await this.orderRepository.save(order);

    // 7. Sauvegarder les OrderItems
    for (const orderItem of orderItems) {
      orderItem.order = savedOrder as Order;
      await this.orderItemRepository.save(orderItem);
    }

    // 8. Réserver le créneau
    timeSlot.currentBookings += 1;
    await this.timeSlotRepository.save(timeSlot);

    // 9. Recharger la commande complète
    return await this.findOne((savedOrder as Order).id, userId);
  }

  /**
   * Récupérer toutes les commandes avec filtres
   */
  async findAll(queryDto: QueryOrderDto, userId?: number): Promise<Order[]> {
    const { status, type, paymentStatus, date, userId: filterUserId } = queryDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.timeSlot', 'timeSlot')
      .leftJoinAndSelect('order.deliveryAddress', 'deliveryAddress')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Si userId fourni (client normal), filtrer par ses commandes
    if (userId) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    // Filtres admin
    if (filterUserId) {
      queryBuilder.andWhere('order.user.id = :filterUserId', { filterUserId });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('order.type = :type', { type });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    if (date) {
      queryBuilder.andWhere('timeSlot.date = :date', { date });
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer une commande par ID
   */
  async findOne(id: number, userId?: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'timeSlot', 'deliveryAddress', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} introuvable`);
    }

    // Vérifier que l'utilisateur a accès à cette commande
    if (userId && order.user.id !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette commande");
    }

    return order;
  }

  /**
   * Mes commandes (client)
   */
  async getMyOrders(userId: number): Promise<Order[]> {
    return await this.findAll({}, userId);
  }

  /**
   * Changer le statut d'une commande (ADMIN/EMPLOYEE)
   */
  async updateStatus(id: number, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    order.status = updateStatusDto.status;

    if (updateStatusDto.internalNote) {
      order.internalNote = updateStatusDto.internalNote;
    }

    // Si complétée, définir la date de complétion
    if (updateStatusDto.status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    // Si annulée, libérer le créneau
    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      const timeSlot = await this.timeSlotRepository.findOne({
        where: { id: order.timeSlot.id },
      });

      if (timeSlot && timeSlot.currentBookings > 0) {
        timeSlot.currentBookings -= 1;
        await this.timeSlotRepository.save(timeSlot);
      }
    }

    return await this.orderRepository.save(order);
  }

  /**
   * Annuler une commande (CLIENT)
   */
  async cancel(id: number, userId: number): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Vérifier que la commande peut être annulée
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cette commande est déjà terminée');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cette commande est déjà annulée');
    }

    if (order.status === OrderStatus.IN_DELIVERY) {
      throw new BadRequestException(
        'Cette commande est en cours de livraison et ne peut plus être annulée',
      );
    }

    // Annuler
    return await this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      internalNote: 'Annulée par le client',
    });
  }

  /**
   * Statistiques pour admin
   */
  async getStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedToday: number;
    revenueToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const totalOrders = await this.orderRepository.count();

    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
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
      .getRawOne();

    const revenueToday = parseFloat(revenueResult?.revenue || '0');

    return {
      totalOrders,
      pendingOrders,
      completedToday,
      revenueToday,
    };
  }
}
