import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddCartItemDto } from './add-cart-item.dto';

/**
 * DTO pour la synchronisation du panier local (invité → connecté).
 * Reçoit la totalité du panier local et le fusionne avec le panier DB.
 */
export class SyncCartDto {
  @IsArray({ message: 'Les items doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}
