import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Matches,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';

/**
 * DTO pour créer un nouveau créneau horaire
 */
export class CreateTimeSlotDto {
  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD attendu)' })
  @IsNotEmpty({ message: 'Date requise' })
  date: string; // Format: "2026-02-15"

  @IsString({ message: "L'heure de début doit être une chaîne" })
  @IsNotEmpty({ message: 'Heure de début requise' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Format d'heure invalide (HH:MM attendu, ex: 12:00)",
  })
  startTime: string; // Format: "12:00"

  @IsString({ message: "L'heure de fin doit être une chaîne" })
  @IsNotEmpty({ message: 'Heure de fin requise' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Format d'heure invalide (HH:MM attendu, ex: 12:30)",
  })
  endTime: string; // Format: "12:30"

  @IsNumber({}, { message: 'Capacité maximale invalide' })
  @IsNotEmpty({ message: 'Capacité maximale requise' })
  @Min(1, { message: 'La capacité maximale doit être au moins 1' })
  maxCapacity: number;

  @IsBoolean({ message: 'isAvailable doit être un booléen' })
  @IsOptional()
  isAvailable?: boolean;
}
