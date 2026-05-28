import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entity/product.entity';
import { ProductIngredient } from '../product-ingredients/entity/product-ingredient.entity';
import { Ingredient } from '../ingredients/entity/ingredient.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

/**
 * Service gérant la logique métier des produits
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepository: Repository<ProductIngredient>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  /**
   * Récupérer tous les produits avec filtres optionnels
   */
  async findAll(queryDto: QueryProductDto): Promise<Product[]> {
    const { category, isActive, isCustomizable, search } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productIngredients', 'productIngredients')
      .leftJoinAndSelect('productIngredients.ingredient', 'ingredient');

    // Filtrer par catégorie
    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    // Filtrer par actif/inactif
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    // Filtrer par personnalisable
    if (isCustomizable !== undefined) {
      queryBuilder.andWhere('product.isCustomizable = :isCustomizable', {
        isCustomizable,
      });
    }

    // Recherche textuelle
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Trier par nom
    queryBuilder.orderBy('product.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer un produit par son ID
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['productIngredients', 'productIngredients.ingredient'],
    });

    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} introuvable`);
    }

    return product;
  }

  /**
   * Créer un nouveau produit
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Vérifier si un produit avec ce nom existe déjà
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Un produit nommé "${createProductDto.name}" existe déjà`,
      );
    }

    // Créer le produit
    const product = this.productRepository.create({
      name: createProductDto.name,
      category: createProductDto.category,
      description: createProductDto.description,
      basePrice: createProductDto.basePrice,
      imageUrl: createProductDto.imageUrl,
      isActive: createProductDto.isActive ?? true,
      isCustomizable: createProductDto.isCustomizable ?? false,
    });

    // Sauvegarder le produit
    const savedProduct = await this.productRepository.save(product);

    // Ajouter les ingrédients si fournis
    if (
      createProductDto.ingredients &&
      createProductDto.ingredients.length > 0
    ) {
      await this.addIngredientsToProduct(
        savedProduct.id,
        createProductDto.ingredients,
      );
    }

    // Recharger le produit avec les relations
    return await this.findOne(savedProduct.id);
  }

  /**
   * Mettre à jour un produit
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Vérifier si le nouveau nom existe déjà (si changement de nom)
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: { name: updateProductDto.name },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Un produit nommé "${updateProductDto.name}" existe déjà`,
        );
      }
    }

    // Mettre à jour les champs simples
    Object.assign(product, updateProductDto);

    // Sauvegarder
    await this.productRepository.save(product);

    // Si des ingrédients sont fournis, les remplacer
    if (updateProductDto.ingredients) {
      // Supprimer les anciens
      await this.productIngredientRepository.delete({ product: { id } });

      // Ajouter les nouveaux
      await this.addIngredientsToProduct(id, updateProductDto.ingredients);
    }

    // Recharger avec les relations
    return await this.findOne(id);
  }

  /**
   * Supprimer un produit
   */
  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  /**
   * Activer/désactiver un produit.
   * La réactivation est bloquée si un ingrédient requis est en rupture.
   */
  async toggleActive(id: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.isActive) {
      for (const pi of product.productIngredients ?? []) {
        if (!pi.isRequired || !pi.ingredient) continue;
        if (!pi.ingredient.isAvailable || Number(pi.ingredient.currentStock) < Number(pi.quantity)) {
          throw new BadRequestException(
            `Impossible de réactiver "${product.name}" : l'ingrédient "${pi.ingredient.name}" est en stock insuffisant (${Number(pi.ingredient.currentStock)} ${pi.ingredient.unit})`,
          );
        }
      }
    }

    product.isActive = !product.isActive;

    return await this.productRepository.save(product);
  }

  /**
   * Ajouter des ingrédients à un produit
   * Méthode privée utilisée lors de la création/modification
   */
  private async addIngredientsToProduct(
    productId: number,
    ingredientDtos: any[],
  ): Promise<void> {
    for (const dto of ingredientDtos) {
      // Vérifier que l'ingrédient existe
      const ingredient = await this.ingredientRepository.findOne({
        where: { id: dto.ingredientId },
      });

      if (!ingredient) {
        throw new BadRequestException(
          `Ingrédient avec l'ID ${dto.ingredientId} introuvable`,
        );
      }

      // Créer la relation ProductIngredient
      const productIngredient = this.productIngredientRepository.create({
        product: { id: productId },
        ingredient: { id: dto.ingredientId },
        quantity: dto.quantity,
        unit: dto.unit || ingredient.unit,
        isRequired: dto.isRequired ?? true,
        extraPrice: dto.extraPrice ?? 0,
      });

      await this.productIngredientRepository.save(productIngredient);
    }
  }

  /**
   * Récupérer les produits d'une catégorie spécifique
   */
  async findByCategory(category: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category: category as any, isActive: true },
      relations: ['productIngredients', 'productIngredients.ingredient'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Vérifier si un produit est disponible (tous ingrédients requis en stock)
   */
  async isProductAvailable(id: number): Promise<boolean> {
    const product = await this.findOne(id);

    for (const pi of product.productIngredients) {
      // Vérifier seulement les ingrédients requis
      if (pi.isRequired && !pi.ingredient.isAvailable) {
        return false;
      }

      // Vérifier le stock
      if (pi.isRequired && pi.ingredient.currentStock < pi.quantity) {
        return false;
      }
    }

    return true;
  }
}
