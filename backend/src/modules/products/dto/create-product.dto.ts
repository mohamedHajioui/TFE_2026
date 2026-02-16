import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../entity/product.entity';

/**
 * DTO pour ajouter un ingrédient à un produit lors de sa création
 */
export class ProductIngredientDto {
  @IsNumber()
  @IsNotEmpty({ message: "ID de l'ingrédient requis" })
  ingredientId: number;

  @IsNumber()
  @Min(0, { message: 'La quantité doit être positive' })
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string; // 'tranches', 'grammes', 'ml', etc.

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean; // true par défaut

  @IsNumber()
  @IsOptional()
  @Min(0)
  extraPrice?: number; // Prix supplément si ajouté
}

/**
 * DTO pour créer un nouveau produit
 */
export class CreateProductDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom du produit requis' })
  @MaxLength(100, { message: 'Nom trop long (max 100 caractères)' })
  name: string;

  @IsEnum(ProductCategory, { message: 'Catégorie invalide' })
  @IsNotEmpty({ message: 'Catégorie requise' })
  category: ProductCategory;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description trop longue (max 500 caractères)' })
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Prix invalide (max 2 décimales)' },
  )
  @IsNotEmpty({ message: 'Prix requis' })
  @Min(0, { message: 'Le prix doit être positif' })
  basePrice: number;

  @IsUrl({}, { message: "URL d'image invalide" })
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // true par défaut

  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean; // false par défaut

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  @IsOptional()
  ingredients?: ProductIngredientDto[]; // Liste des ingrédients du produit
}
