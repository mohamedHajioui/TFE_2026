import { IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour filtrer/rechercher des menus
 */
export class QueryMenuDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive doit être un booléen' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'availableNow doit être un booléen' })
  availableNow?: boolean; // Filtrer les menus disponibles aujourd'hui

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide' })
  date?: string; // Filtrer les menus disponibles à une date précise

  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;
}
