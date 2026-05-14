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

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
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
}
