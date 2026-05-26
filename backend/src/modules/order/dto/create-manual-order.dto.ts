import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order.dto';

/**
 * DTO pour les commandes manuelles (caisse / POS).
 * Pas de timeSlotId, pas de guest, pas de livraison.
 */
export class CreateManualOrderDto {
  @IsArray({ message: 'Les items doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un item est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString({ message: 'Note invalide' })
  @IsOptional()
  customerNote?: string;
}
