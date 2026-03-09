import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entity/order.entity';

/**
 * DTO pour un item de commande
 */
export class CreateOrderItemDto {
  @IsNumber({}, { message: 'ID du produit invalide' })
  @IsNotEmpty({ message: 'ID du produit requis' })
  productId: number;

  @IsNumber({}, { message: 'Quantité invalide' })
  @IsNotEmpty({ message: 'Quantité requise' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity: number;

  @IsOptional()
  customization?: {
    removed?: number[]; // IDs des ingrédients retirés
    extra?: number[]; // IDs des ingrédients ajoutés
    breadType?: string;
    notes?: string;
  };

  @IsString({ message: 'Instructions spéciales invalides' })
  @IsOptional()
  specialInstructions?: string;
}

/**
 * DTO pour créer une commande
 */
export class CreateOrderDto {
  @IsEnum(OrderType, { message: 'Type de commande invalide' })
  @IsNotEmpty({ message: 'Type de commande requis' })
  type: OrderType; // PICKUP ou DELIVERY

  @IsNumber({}, { message: 'ID du créneau invalide' })
  @IsNotEmpty({ message: 'Créneau horaire requis' })
  timeSlotId: number;

  @IsNumber({}, { message: "ID de l'adresse invalide" })
  @IsOptional()
  deliveryAddressId?: number; // Requis si type = DELIVERY

  @IsArray({ message: 'Les items doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un produit est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString({ message: 'Note client invalide' })
  @IsOptional()
  customerNote?: string;
}
