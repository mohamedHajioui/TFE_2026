import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../entity/product.entity';

/**
 * DTO pour filtrer/rechercher des produits
 */
export class QueryProductDto {
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory; // Filtrer par catégorie

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean; // Filtrer par actif/inactif

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCustomizable?: boolean; // Filtrer par personnalisable

  @IsOptional()
  @IsString()
  search?: string; // Recherche par nom ou description
}
