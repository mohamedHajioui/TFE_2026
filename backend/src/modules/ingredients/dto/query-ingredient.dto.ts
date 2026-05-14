import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientCategory } from '../entity/ingredient.entity';

/**
 * DTO pour filtrer/rechercher des ingrédients
 */
export class QueryIngredientDto {
  @IsOptional()
  @IsEnum(IngredientCategory, { message: 'Catégorie invalide' })
  category?: IngredientCategory;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isAvailable doit être un booléen' })
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'lowStock doit être un booléen' })
  lowStock?: boolean; // Filtrer les ingrédients en rupture de stock

  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;
}
