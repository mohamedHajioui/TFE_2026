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

    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      isAvailable: createIngredientDto.isAvailable ?? true,
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

    Object.assign(ingredient, updateIngredientDto);

    if (Number(ingredient.currentStock) <= 0) ingredient.isAvailable = false;

    return await this.ingredientRepository.save(ingredient);
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

    const newStock = Number(ingredient.currentStock) + Number(quantity);

    if (newStock < 0) {
      throw new BadRequestException(
        `Stock insuffisant. Stock actuel : ${Number(ingredient.currentStock)} ${ingredient.unit}`,
      );
    }

    ingredient.currentStock = newStock;
    ingredient.isAvailable = newStock > 0;

    return await this.ingredientRepository.save(ingredient);
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

    const ingredientDeltas = new Map<number, number>(); // ingredientId → quantité à déduire

    for (const item of items) {
      if (item.itemType === 'product' && item.product) {
        this.collectProductDeltas(item.product, item.quantity, item.customization, ingredientDeltas);
      } else if (item.itemType === 'menu' && item.menuChoices) {
        await this.collectMenuDeltas(item.menuChoices, item.quantity, ingredientDeltas);
      }
    }

    // Appliquer les déductions
    const touchedIngredientIds: number[] = [];
    for (const [ingredientId, qty] of ingredientDeltas) {
      const ingredient = await this.ingredientRepository.findOne({ where: { id: ingredientId } });
      if (!ingredient) continue;

      const newStock = Math.max(0, Number(ingredient.currentStock) - qty);
      ingredient.currentStock = newStock;
      ingredient.isAvailable = newStock > 0;
      await this.ingredientRepository.save(ingredient);
      touchedIngredientIds.push(ingredientId);

      this.logger.log(
        `Stock déduit: ${ingredient.name} -${qty} ${ingredient.unit} → ${newStock} ${ingredient.unit} (commande #${orderId})`,
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

    // Restaurer les stocks
    const touchedIngredientIds: number[] = [];
    for (const [ingredientId, qty] of ingredientDeltas) {
      const ingredient = await this.ingredientRepository.findOne({ where: { id: ingredientId } });
      if (!ingredient) continue;

      const newStock = Number(ingredient.currentStock) + qty;
      ingredient.currentStock = newStock;
      ingredient.isAvailable = newStock > 0;
      await this.ingredientRepository.save(ingredient);
      touchedIngredientIds.push(ingredientId);

      this.logger.log(
        `Stock restauré: ${ingredient.name} +${qty} ${ingredient.unit} → ${newStock} ${ingredient.unit} (annulation commande #${orderId})`,
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
      if (pi.isRequired && !removedIds.has(ingredientId)) {
        const qty = Number(pi.quantity) * orderQuantity;
        deltas.set(ingredientId, (deltas.get(ingredientId) ?? 0) + qty);
      }

      // Ingrédient optionnel retiré → on ne déduit pas (il n'est pas de base)
      // Ingrédient ajouté en extra → on déduit
      if (extraIds.has(ingredientId)) {
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
   * Vérifie chaque menu actif : si une catégorie requise n'a plus aucun produit actif,
   * le menu est désactivé. Si tous les catégories requises ont au moins un produit actif,
   * le menu est réactivé.
   */
  private async checkAndDisableMenus(): Promise<void> {
    const menus = await this.menuRepository.find({
      relations: ['allowedProducts'],
    });

    for (const menu of menus) {
      const config = menu.configuration;
      const products = menu.allowedProducts ?? [];

      let shouldBeActive = true;

      // Pour chaque catégorie requise, vérifier qu'au moins un produit est actif
      const categories = ['sandwich', 'drink', 'dessert', 'side'] as const;
      for (const cat of categories) {
        const catConfig = config[cat];
        if (!catConfig?.required || catConfig.quantity === 0) continue;

        const catUpper = cat.toUpperCase();
        const activeInCategory = products.filter(
          (p) => p.category === catUpper && p.isActive,
        );

        if (activeInCategory.length === 0) {
          shouldBeActive = false;
          break;
        }
      }

      if (menu.isActive && !shouldBeActive) {
        menu.isActive = false;
        await this.menuRepository.save(menu);
        this.logger.warn(`Menu "${menu.name}" désactivé automatiquement (produits indisponibles)`);
      } else if (!menu.isActive && shouldBeActive) {
        menu.isActive = true;
        await this.menuRepository.save(menu);
        this.logger.log(`Menu "${menu.name}" réactivé automatiquement`);
      }
    }
  }
}
