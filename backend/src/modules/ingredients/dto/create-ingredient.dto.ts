import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { IngredientCategory } from '../entity/ingredient.entity';

/**
 * DTO pour créer un nouvel ingrédient
 */
export class CreateIngredientDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: "Nom de l'ingrédient requis" })
  @MaxLength(100, { message: 'Nom trop long (max 100 caractères)' })
  name: string;

  @IsEnum(IngredientCategory, { message: 'Catégorie invalide' })
  @IsNotEmpty({ message: 'Catégorie requise' })
  category: IngredientCategory;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Stock actuel invalide' })
  @IsNotEmpty({ message: 'Stock actuel requis' })
  @Min(0, { message: 'Le stock actuel doit être positif ou nul' })
  currentStock: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Stock minimum invalide' })
  @IsNotEmpty({ message: 'Stock minimum requis' })
  @Min(0, { message: 'Le stock minimum doit être positif ou nul' })
  minStock: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Stock maximum invalide' })
  @IsNotEmpty({ message: 'Stock maximum requis' })
  @Min(0, { message: 'Le stock maximum doit être positif ou nul' })
  maxStock: number;

  @IsString({ message: "L'unité doit être une chaîne de caractères" })
  @IsNotEmpty({ message: 'Unité requise' })
  @MaxLength(50, { message: 'Unité trop longue (max 50 caractères)' })
  unit: string; // 'kg', 'litres', 'unités', 'tranches'

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Coût unitaire invalide' })
  @IsOptional()
  @Min(0, { message: 'Le coût unitaire doit être positif ou nul' })
  costPerUnit?: number;

  @IsBoolean({ message: 'isAvailable doit être un booléen' })
  @IsOptional()
  isAvailable?: boolean;
}
