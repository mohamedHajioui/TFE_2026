import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour filtrer/rechercher des créneaux horaires
 */
export class QueryTimeSlotDto {
  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide' })
  date?: string; // Filtrer par date spécifique

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide' })
  dateFrom?: string; // Date de début (range)

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide' })
  dateTo?: string; // Date de fin (range)

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isAvailable doit être un booléen' })
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'onlyFull doit être un booléen' })
  onlyFull?: boolean; // Filtrer les créneaux complets
}
