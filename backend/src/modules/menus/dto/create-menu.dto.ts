import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class MenuCategoryConfig {
  @IsBoolean()
  required: boolean;

  @IsNumber()
  @Min(0)
  quantity: number;
}

class MenuConfiguration {
  @ValidateNested()
  @Type(() => MenuCategoryConfig)
  sandwich: MenuCategoryConfig;

  @ValidateNested()
  @Type(() => MenuCategoryConfig)
  drink: MenuCategoryConfig;

  @ValidateNested()
  @Type(() => MenuCategoryConfig)
  dessert: MenuCategoryConfig;

  @ValidateNested()
  @Type(() => MenuCategoryConfig)
  side: MenuCategoryConfig;
}

/**
 * DTO pour créer un nouveau menu
 */
export class CreateMenuDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom du menu requis' })
  @MaxLength(100, { message: 'Nom trop long (max 100 caractères)' })
  name: string;

  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  @MaxLength(255, { message: 'Description trop longue (max 255 caractères)' })
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Prix invalide (max 2 décimales)' },
  )
  @IsNotEmpty({ message: 'Prix requis' })
  @Min(0, { message: 'Le prix doit être positif' })
  price: number;

  @IsArray({ message: 'Les produits doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un produit est requis' })
  @IsNumber(
    {},
    { each: true, message: 'Chaque ID de produit doit être un nombre' },
  )
  productIds: number[]; // IDs des produits inclus dans le menu

  @IsObject({ message: 'La configuration doit être un objet' })
  @ValidateNested()
  @Type(() => MenuConfiguration)
  configuration: {
    sandwich: { required: boolean; quantity: number };
    drink: { required: boolean; quantity: number };
    dessert: { required: boolean; quantity: number };
    side: { required: boolean; quantity: number };
  };

  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD attendu)' })
  @IsOptional()
  availableFrom?: string; // Date de début de disponibilité

  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD attendu)' })
  @IsOptional()
  availableTo?: string; // Date de fin de disponibilité

  @IsBoolean({ message: 'isActive doit être un booléen' })
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
