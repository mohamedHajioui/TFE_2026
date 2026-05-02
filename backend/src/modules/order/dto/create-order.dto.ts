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
  ValidateIf,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entity/order.entity';

/**
 * DTO pour un item de commande.
 * Un item est SOIT un produit (productId) SOIT un menu (menuId + menuChoices).
 */
export class CreateOrderItemDto {
  @IsEnum(['product', 'menu'], {
    message: 'itemType doit être "product" ou "menu"',
  })
  @IsNotEmpty({ message: 'itemType requis' })
  itemType: 'product' | 'menu';

  @ValidateIf((o: CreateOrderItemDto) => o.itemType === 'product')
  @IsNumber({}, { message: 'productId invalide' })
  @IsNotEmpty({ message: 'productId requis pour un item de type product' })
  productId?: number;

  @ValidateIf((o: CreateOrderItemDto) => o.itemType === 'menu')
  @IsNumber({}, { message: 'menuId invalide' })
  @IsNotEmpty({ message: 'menuId requis pour un item de type menu' })
  menuId?: number;

  @IsOptional()
  menuChoices?: {
    sandwich?: number;
    drink?: number;
    dessert?: number;
    side?: number;
  };

  @IsNumber({}, { message: 'Quantité invalide' })
  @IsNotEmpty({ message: 'Quantité requise' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity: number;

  @IsOptional()
  customization?: {
    removed?: number[];
    extra?: number[];
    breadType?: string;
    notes?: string;
  };

  @IsString({ message: 'Instructions spéciales invalides' })
  @IsOptional()
  specialInstructions?: string;
}

/**
 * Infos invité — requises UNIQUEMENT si commande sans authentification.
 */
export class GuestInfoDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom requis' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Numéro de téléphone requis' })
  @MaxLength(30)
  phone: string;
}

/**
 * Adresse inline invité — requise UNIQUEMENT si guest + DELIVERY.
 */
export class GuestAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Rue requise' })
  @MaxLength(255)
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'Numéro requis' })
  @MaxLength(10)
  number: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  box?: string;

  @IsString()
  @IsNotEmpty({ message: 'Code postal requis' })
  @MaxLength(10)
  postalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Ville requise' })
  @MaxLength(100)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  complement?: string;
}

/**
 * DTO principal — création de commande.
 *
 * Scénarios valides :
 *   1. User connecté + PICKUP       → items + timeSlotId
 *   2. User connecté + DELIVERY     → items + timeSlotId + deliveryAddressId
 *   3. Invité + PICKUP              → items + timeSlotId + guest
 *   4. Invité + DELIVERY            → items + timeSlotId + guest + guestAddress
 */
export class CreateOrderDto {
  @IsEnum(OrderType, { message: 'Type de commande invalide' })
  @IsNotEmpty({ message: 'Type de commande requis' })
  type: OrderType;

  @IsNumber({}, { message: 'ID du créneau invalide' })
  @IsNotEmpty({ message: 'Créneau horaire requis' })
  timeSlotId: number;

  /** User connecté + DELIVERY : référence à une adresse sauvegardée */
  @IsNumber({}, { message: "ID de l'adresse invalide" })
  @IsOptional()
  deliveryAddressId?: number;

  /** Infos invité — requis si pas authentifié */
  @ValidateNested()
  @Type(() => GuestInfoDto)
  @IsOptional()
  guest?: GuestInfoDto;

  /** Adresse inline invité — requis si guest + DELIVERY */
  @ValidateNested()
  @Type(() => GuestAddressDto)
  @IsOptional()
  guestAddress?: GuestAddressDto;

  @IsArray({ message: 'Les items doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un item est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString({ message: 'Note client invalide' })
  @IsOptional()
  customerNote?: string;

  /**
   * Coordonnées GPS du client pour le calcul du prix de livraison.
   */
  @IsNumber({}, { message: 'Latitude invalide' })
  @IsOptional()
  customerLat?: number;

  @IsNumber({}, { message: 'Longitude invalide' })
  @IsOptional()
  customerLng?: number;
}
