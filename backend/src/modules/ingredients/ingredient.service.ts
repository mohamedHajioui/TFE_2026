import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ingredient } from './entity/ingredient.entity';
import {
  StockMovement,
  StockMovementType,
} from './entity/stock-movement.entity';
import { Product } from '../products/entity/product.entity';
import { ProductIngredient } from '../product-ingredients/entity/product-ingredient.entity';
import { Menu } from '../menus/entity/menu.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { QueryIngredientDto } from './dto/query-ingredient.dto';

@Injectable()
export class IngredientService {
  private readonly logger = new Logger(IngredientService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepository: Repository<ProductIngredient>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async findAll(queryDto: QueryIngredientDto): Promise<Ingredient[]> {
    const { category, isAvailable, lowStock, search } = queryDto;
    const qb = this.ingredientRepository.createQueryBuilder('ingredient');

    if (category) qb.andWhere('ingredient.category = :category', { category });
    if (isAvailable !== undefined)
      qb.andWhere('ingredient.isAvailable = :isAvailable', { isAvailable });
    if (lowStock) qb.andWhere('ingredient.currentStock < ingredient.minStock');
    if (search)
      qb.andWhere('ingredient.name ILIKE :search', { search: `%${search}%` });

    qb.orderBy('ingredient.name', 'ASC');
    return await qb.getMany();
  }

  async findOne(id: number): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
      relations: ['productIngredients', 'productIngredients.product'],
    });

    if (!ingredient)
      throw new NotFoundException(`Ingrédient avec l'ID ${id} introuvable`);
    return ingredient;
  }

  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.ingredientRepository.findOne({
      where: { name: createIngredientDto.name },
    });
    if (existing)
      throw new ConflictException(
        `Un ingrédient nommé "${createIngredientDto.name}" existe déjà`,
      );

    const initialStock = Number(createIngredientDto.currentStock ?? 0);
    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      isAvailable: initialStock > 0 ? (createIngredientDto.isAvailable ?? true) : false,
      costPerUnit: createIngredientDto.costPerUnit ?? 0,
    });

    return await this.ingredientRepository.save(ingredient);
  }

  async update(
    id: number,
    updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    const ingredient = await this.findOne(id);

    if (
      updateIngredientDto.name &&
      updateIngredientDto.name !== ingredient.name
    ) {
      const existing = await this.ingredientRepository.findOne({
        where: { name: updateIngredientDto.name },
      });
      if (existing)
        throw new ConflictException(
          `Un ingrédient nommé "${updateIngredientDto.name}" existe déjà`,
        );
    }

    if (
      updateIngredientDto.currentStock !== undefined &&
      Number(updateIngredientDto.currentStock) < 0
    ) {
      throw new BadRequestException('Le stock ne peut pas être négatif');
    }

    const stockBefore = Number(ingredient.currentStock);
    Object.assign(ingredient, updateIngredientDto);

    if (Number(ingredient.currentStock) <= 0) ingredient.isAvailable = false;
    else ingredient.isAvailable = true;

    const saved = await this.ingredientRepository.save(ingredient);

    const stockAfter = Number(saved.currentStock);
    if (stockAfter !== stockBefore) {
      await this.logMovement(
        saved,
        StockMovementType.ADJUSTMENT,
        stockAfter - stockBefore,
        stockBefore,
        stockAfter,
        'Modification directe',
        null,
      );
      if (stockAfter < stockBefore) {
        await this.checkAndDisableProducts([saved.id]);
      } else {
        await this.checkAndReenableProducts([saved.id]);
      }
    }

    return saved;
  }

  async remove(id: number): Promise<void> {
    const ingredient = await this.findOne(id);

    if (ingredient.productIngredients?.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cet ingrédient : il est utilisé dans ${ingredient.productIngredients.length} produit(s)`,
      );
    }

    await this.ingredientRepository.remove(ingredient);
  }

  async adjustStock(
    id: number,
    quantity: number,
    reason?: string,
  ): Promise<Ingredient> {
    const ingredient = await this.findOne(id);

    const stockBefore = Number(ingredient.currentStock);
    const newStock = stockBefore + Number(quantity);

    if (newStock < 0) {
      throw new BadRequestException(
        `Stock insuffisant. Stock actuel : ${stockBefore} ${ingredient.unit}`,
      );
    }

    ingredient.currentStock = newStock;
    ingredient.isAvailable = newStock > 0;

    const saved = await this.ingredientRepository.save(ingredient);

    await this.logMovement(
      ingredient,
      StockMovementType.ADJUSTMENT,
      quantity,
      stockBefore,
      newStock,
      reason ?? null,
      null,
    );

    if (quantity < 0) {
      await this.checkAndDisableProducts([ingredient.id]);
    } else if (quantity > 0) {
      await this.checkAndReenableProducts([ingredient.id]);
    }

    return saved;
  }

  async findLowStock(): Promise<Ingredient[]> {
    return await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.currentStock < ingredient.minStock')
      .orderBy('ingredient.currentStock', 'ASC')
      .getMany();
  }

  async checkAvailability(
    id: number,
    quantityNeeded: number,
  ): Promise<boolean> {
    const ingredient = await this.findOne(id);
    return (
      ingredient.isAvailable &&
      Number(ingredient.currentStock) >= quantityNeeded
    );
  }

  /**
   * Déduit le stock de chaque ingrédient pour tous les items d'une commande.
   * Appelé après paiement confirmé (ou immédiatement pour commande manuelle).
   */
  async deductOrderStock(orderId: number): Promise<void> {
    const items = await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['product', 'product.productIngredients', 'product.productIngredients.ingredient', 'menu'],
    });

    const ingredientDeltas = new Map<number, number>(); // ingredientId - quantité à déduire

    for (const item of items) {
      if (item.itemType === 'product' && item.product) {
        this.collectProductDeltas(item.product, item.quantity, item.customization, ingredientDeltas);
      } else if (item.itemType === 'menu' && item.menuChoices) {
        await this.collectMenuDeltas(item.menuChoices, item.quantity, ingredientDeltas);
      }
    }

    const touchedIngredientIds: number[] = [];
    for (const [ingredientId, qty] of ingredientDeltas) {
      const ingredient = await this.ingredientRepository.findOne({ where: { id: ingredientId } });
      if (!ingredient) continue;

      const stockBefore = Number(ingredient.currentStock);
      if (stockBefore < qty) {
        this.logger.error(
          `Stock insuffisant détecté à la déduction : "${ingredient.name}" (besoin: ${qty}, dispo: ${stockBefore}) — commande #${orderId}`,
        );
      }
      const newStock = Math.max(0, stockBefore - qty);
      ingredient.currentStock = newStock;
      ingredient.isAvailable = newStock > 0;
      await this.ingredientRepository.save(ingredient);
      touchedIngredientIds.push(ingredientId);

      await this.logMovement(
        ingredient,
        StockMovementType.ORDER_DEDUCTION,
        -qty,
        stockBefore,
        newStock,
        null,
        orderId,
      );
    }

    // Vérifier et désactiver les produits/menus si nécessaire
    if (touchedIngredientIds.length > 0) {
      await this.checkAndDisableProducts(touchedIngredientIds);
    }
  }

  /**
   * Restaure le stock après annulation d'une commande déjà payée.
   */
  async restoreOrderStock(orderId: number): Promise<void> {
    const items = await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['product', 'product.productIngredients', 'product.productIngredients.ingredient', 'menu'],
    });

    const ingredientDeltas = new Map<number, number>();

    for (const item of items) {
      if (item.itemType === 'product' && item.product) {
        this.collectProductDeltas(item.product, item.quantity, item.customization, ingredientDeltas);
      } else if (item.itemType === 'menu' && item.menuChoices) {
        await this.collectMenuDeltas(item.menuChoices, item.quantity, ingredientDeltas);
      }
    }

    const touchedIngredientIds: number[] = [];
    for (const [ingredientId, qty] of ingredientDeltas) {
      const ingredient = await this.ingredientRepository.findOne({ where: { id: ingredientId } });
      if (!ingredient) continue;

      const stockBefore = Number(ingredient.currentStock);
      const newStock = stockBefore + qty;
      ingredient.currentStock = newStock;
      ingredient.isAvailable = newStock > 0;
      await this.ingredientRepository.save(ingredient);
      touchedIngredientIds.push(ingredientId);

      await this.logMovement(
        ingredient,
        StockMovementType.ORDER_RESTORE,
        qty,
        stockBefore,
        newStock,
        null,
        orderId,
      );
    }

    // Réactiver les produits/menus si le stock est revenu
    if (touchedIngredientIds.length > 0) {
      await this.checkAndReenableProducts(touchedIngredientIds);
    }
  }

  /**
   * Collecte les quantités à déduire pour un produit donné.
   * Tient compte de la customization (removed/extra).
   */
  private collectProductDeltas(
    product: Product,
    orderQuantity: number,
    customization: { removed?: number[]; extra?: number[] } | null,
    deltas: Map<number, number>,
  ): void {
    if (!product.productIngredients) return;

    const removedIds = new Set(customization?.removed ?? []);
    const extraIds = new Set(customization?.extra ?? []);

    for (const pi of product.productIngredients) {
      const ingredientId = pi.ingredient?.id;
      if (!ingredientId) continue;

      // Ingrédient de base non retiré → on déduit
      const isKept = pi.isRequired && !removedIds.has(ingredientId);
      const isExtra = !pi.isRequired && extraIds.has(ingredientId);

      if (isKept || isExtra) {
        const qty = Number(pi.quantity) * orderQuantity;
        deltas.set(ingredientId, (deltas.get(ingredientId) ?? 0) + qty);
      }
    }
  }

  /**
   * Collecte les quantités à déduire pour les choix d'un menu.
   */
  private async collectMenuDeltas(
    menuChoices: { sandwich?: number; drink?: number; dessert?: number; side?: number },
    orderQuantity: number,
    deltas: Map<number, number>,
  ): Promise<void> {
    const chosenProductIds = Object.values(menuChoices).filter(
      (id): id is number => id !== undefined && id !== null,
    );

    if (chosenProductIds.length === 0) return;

    const products = await this.productRepository.find({
      where: { id: In(chosenProductIds) },
      relations: ['productIngredients', 'productIngredients.ingredient'],
    });

    for (const product of products) {
      // Pour un menu, pas de customization — on déduit tous les ingrédients required
      this.collectProductDeltas(product, orderQuantity, null, deltas);
    }
  }

  /**
   * Après déduction de stock, vérifie si des produits doivent être désactivés
   * (un ingrédient requis est en rupture) et si des menus doivent l'être aussi
   * (plus aucun produit disponible dans une catégorie requise).
   */
  async checkAndDisableProducts(touchedIngredientIds: number[]): Promise<void> {
    // Trouver tous les produits qui utilisent ces ingrédients
    const affectedPIs = await this.productIngredientRepository.find({
      where: { ingredient: { id: In(touchedIngredientIds) }, isRequired: true },
      relations: ['product', 'ingredient'],
    });

    const productIdsToCheck = [...new Set(affectedPIs.map((pi) => pi.product.id))];

    for (const productId of productIdsToCheck) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['productIngredients', 'productIngredients.ingredient'],
      });
      if (!product || !product.isActive) continue;

      // Vérifier si un ingrédient requis est indisponible ou insuffisant
      const hasUnavailable = product.productIngredients.some(
        (pi) =>
          pi.isRequired &&
          (!pi.ingredient.isAvailable || Number(pi.ingredient.currentStock) < Number(pi.quantity)),
      );

      if (hasUnavailable) {
        product.isActive = false;
        await this.productRepository.save(product);
        this.logger.warn(`Produit "${product.name}" désactivé automatiquement (stock insuffisant)`);
      }
    }

    // Vérifier les menus qui contiennent des produits désactivés
    await this.checkAndDisableMenus();
  }

  /**
   * Après restauration de stock, vérifie si des produits peuvent être réactivés.
   */
  private async checkAndReenableProducts(touchedIngredientIds: number[]): Promise<void> {
    const affectedPIs = await this.productIngredientRepository.find({
      where: { ingredient: { id: In(touchedIngredientIds) }, isRequired: true },
      relations: ['product', 'product.productIngredients', 'product.productIngredients.ingredient'],
    });

    const checkedProducts = new Set<number>();

    for (const pi of affectedPIs) {
      const product = pi.product;
      if (!product || product.isActive || checkedProducts.has(product.id)) continue;
      checkedProducts.add(product.id);

      // Vérifier si TOUS les ingrédients requis sont maintenant disponibles
      const allAvailable = product.productIngredients
        .filter((p) => p.isRequired)
        .every(
          (p) =>
            p.ingredient.isAvailable && Number(p.ingredient.currentStock) >= Number(p.quantity),
        );

      if (allAvailable) {
        product.isActive = true;
        await this.productRepository.save(product);
        this.logger.log(`Produit "${product.name}" réactivé automatiquement (stock restauré)`);
      }
    }

    await this.checkAndDisableMenus();
  }

  /**
   * Vérifie chaque menu : si une catégorie requise n'a plus aucun produit actif,
   * le menu est désactivé. Si toutes les catégories requises ont au moins un produit
   * actif, le menu est (ré)activé.
   *
   * On interroge la DB directement via count() pour éviter tout problème de
   * cache lié à l'identity map de TypeORM (données isActive potentiellement
   * périmées juste après un save dans la même requête).
   */
  private async checkAndDisableMenus(): Promise<void> {
    // createQueryBuilder évite le cache de l'EntityManager pour le chargement initial
    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.allowedProducts', 'product')
      .getMany();

    for (const menu of menus) {
      const config = menu.configuration;
      const allowedProducts = menu.allowedProducts ?? [];
      let shouldBeActive = true;

      const categories = ['sandwich', 'drink', 'dessert', 'side'] as const;

      for (const cat of categories) {
        const catConfig = config?.[cat];
        if (!catConfig?.required || catConfig.quantity === 0) continue;

        const catUpper = cat.toUpperCase();

        // IDs des produits de cette catégorie dans ce menu
        const productIdsInCat = allowedProducts
          .filter((p) => p.category === catUpper)
          .map((p) => p.id);

        if (productIdsInCat.length === 0) {
          // Aucun produit du tout dans une catégorie obligatoire → désactiver
          shouldBeActive = false;
          this.logger.warn(
            `Menu "${menu.name}" : aucun produit dans la catégorie requise "${cat}"`,
          );
          break;
        }

        // Requête directe en DB pour le statut isActive — évite l'identity map
        const activeCount = await this.productRepository.count({
          where: { id: In(productIdsInCat), isActive: true },
        });

        if (activeCount === 0) {
          shouldBeActive = false;
          this.logger.warn(
            `Menu "${menu.name}" : plus aucun produit actif dans la catégorie requise "${cat}"`,
          );
          break;
        }
      }

      if (menu.isActive && !shouldBeActive) {
        menu.isActive = false;
        await this.menuRepository.save(menu);
        this.logger.warn(
          `Menu "${menu.name}" désactivé automatiquement (produits indisponibles)`,
        );
      } else if (!menu.isActive && shouldBeActive) {
        menu.isActive = true;
        await this.menuRepository.save(menu);
        this.logger.log(
          `Menu "${menu.name}" réactivé automatiquement (stock restauré)`,
        );
      }
    }
  }

  private async logMovement(
    ingredient: Ingredient,
    type: StockMovementType,
    quantity: number,
    stockBefore: number,
    stockAfter: number,
    reason: string | null,
    orderId: number | null,
  ): Promise<void> {
    const movement = this.stockMovementRepository.create({
      ingredient,
      type,
      quantity,
      stockBefore,
      stockAfter,
      reason,
      orderId,
    });
    await this.stockMovementRepository.save(movement);
  }

  async getMovements(
    ingredientId?: number,
    limit = 50,
  ): Promise<StockMovement[]> {
    const qb = this.stockMovementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.ingredient', 'ingredient')
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (ingredientId) {
      qb.andWhere('m.ingredient.id = :ingredientId', { ingredientId });
    }

    return await qb.getMany();
  }
}
