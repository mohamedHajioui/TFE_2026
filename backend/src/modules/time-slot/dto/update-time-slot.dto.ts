import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeSlotDto } from './create-time-slot.dto';
import { IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO pour modifier un créneau horaire
 */
export class UpdateTimeSlotDto extends PartialType(CreateTimeSlotDto) {
  @IsNumber({}, { message: 'Réservations actuelles invalide' })
  @IsOptional()
  @Min(0, { message: 'Les réservations actuelles doivent être positives' })
  currentBookings?: number;
}
