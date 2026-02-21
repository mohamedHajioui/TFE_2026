import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entity/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { QueryIngredientDto } from './dto/query-ingredient.dto';

/**
 * Service gérant la logique métier des ingrédients
 */
@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  /**
   * Récupérer tous les ingrédients avec filtres optionnels
   */
  async findAll(queryDto: QueryIngredientDto): Promise<Ingredient[]> {
    const { category, isAvailable, lowStock, search } = queryDto;

    const queryBuilder =
      this.ingredientRepository.createQueryBuilder('ingredient');

    // Filtrer par catégorie
    if (category) {
      queryBuilder.andWhere('ingredient.category = :category', { category });
    }

    // Filtrer par disponibilité
    if (isAvailable !== undefined) {
      queryBuilder.andWhere('ingredient.isAvailable = :isAvailable', {
        isAvailable,
      });
    }

    // Filtrer par stock faible (currentStock < minStock)
    if (lowStock) {
      queryBuilder.andWhere('ingredient.currentStock < ingredient.minStock');
    }

    // Recherche textuelle
    if (search) {
      queryBuilder.andWhere('ingredient.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Trier par nom
    queryBuilder.orderBy('ingredient.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer un ingrédient par son ID
   */
  async findOne(id: number): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
      relations: ['productIngredients', 'productIngredients.product'],
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingrédient avec l'ID ${id} introuvable`);
    }

    return ingredient;
  }

  /**
   * Créer un nouvel ingrédient
   */
  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    // Vérifier si un ingrédient avec ce nom existe déjà
    const existingIngredient = await this.ingredientRepository.findOne({
      where: { name: createIngredientDto.name },
    });

    if (existingIngredient) {
      throw new ConflictException(
        `Un ingrédient nommé "${createIngredientDto.name}" existe déjà`,
      );
    }

    // Valider que maxStock >= minStock
    if (createIngredientDto.maxStock < createIngredientDto.minStock) {
      throw new BadRequestException(
        'Le stock maximum doit être supérieur ou égal au stock minimum',
      );
    }

    // Créer l'ingrédient
    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      isAvailable: createIngredientDto.isAvailable ?? true,
      costPerUnit: createIngredientDto.costPerUnit ?? 0,
    });

    return await this.ingredientRepository.save(ingredient);
  }

  /**
   * Mettre à jour un ingrédient
   */
  async update(
    id: number,
    updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    const ingredient = await this.findOne(id);

    // Vérifier si le nouveau nom existe déjà
    if (
      updateIngredientDto.name &&
      updateIngredientDto.name !== ingredient.name
    ) {
      const existingIngredient = await this.ingredientRepository.findOne({
        where: { name: updateIngredientDto.name },
      });

      if (existingIngredient) {
        throw new ConflictException(
          `Un ingrédient nommé "${updateIngredientDto.name}" existe déjà`,
        );
      }
    }

    // Valider maxStock >= minStock si modifiés
    const newMaxStock = updateIngredientDto.maxStock ?? ingredient.maxStock;
    const newMinStock = updateIngredientDto.minStock ?? ingredient.minStock;

    if (newMaxStock < newMinStock) {
      throw new BadRequestException(
        'Le stock maximum doit être supérieur ou égal au stock minimum',
      );
    }

    // Mettre à jour
    Object.assign(ingredient, updateIngredientDto);

    // Auto-désactiver si stock épuisé
    if (ingredient.currentStock <= 0) {
      ingredient.isAvailable = false;
    }

    return await this.ingredientRepository.save(ingredient);
  }

  /**
   * Supprimer un ingrédient
   */
  async remove(id: number): Promise<void> {
    const ingredient = await this.findOne(id);

    // Vérifier si l'ingrédient est utilisé dans des produits
    if (
      ingredient.productIngredients &&
      ingredient.productIngredients.length > 0
    ) {
      throw new BadRequestException(
        `Impossible de supprimer cet ingrédient : il est utilisé dans ${ingredient.productIngredients.length} produit(s)`,
      );
    }

    await this.ingredientRepository.remove(ingredient);
  }

  /**
   * Ajuster le stock d'un ingrédient (ajout ou retrait)
   */
  async adjustStock(
    id: number,
    quantity: number,
    reason?: string,
  ): Promise<Ingredient> {
    const ingredient = await this.findOne(id);

    const newStock = ingredient.currentStock + quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Stock insuffisant. Stock actuel : ${ingredient.currentStock} ${ingredient.unit}`,
      );
    }

    if (newStock > ingredient.maxStock) {
      throw new BadRequestException(
        `Stock maximum dépassé. Maximum : ${ingredient.maxStock} ${ingredient.unit}`,
      );
    }

    ingredient.currentStock = newStock;

    // Auto-désactiver si stock épuisé
    if (ingredient.currentStock <= 0) {
      ingredient.isAvailable = false;
    } else {
      ingredient.isAvailable = true;
    }

    return await this.ingredientRepository.save(ingredient);
  }

  /**
   * Récupérer les ingrédients en stock faible (< minStock)
   */
  async findLowStock(): Promise<Ingredient[]> {
    return await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.currentStock < ingredient.minStock')
      .orderBy('ingredient.currentStock', 'ASC')
      .getMany();
  }

  /**
   * Vérifier si un ingrédient est disponible en quantité suffisante
   */
  async checkAvailability(
    id: number,
    quantityNeeded: number,
  ): Promise<boolean> {
    const ingredient = await this.findOne(id);

    return ingredient.isAvailable && ingredient.currentStock >= quantityNeeded;
  }
}
