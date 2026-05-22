import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddCartItemDto {
  @IsEnum(['product', 'menu'], {
    message: 'itemType doit être "product" ou "menu"',
  })
  @IsNotEmpty({ message: 'itemType requis' })
  itemType: 'product' | 'menu';

  @ValidateIf((o: AddCartItemDto) => o.itemType === 'product')
  @IsNumber({}, { message: 'productId invalide' })
  @IsNotEmpty({ message: 'productId requis pour un item de type product' })
  productId?: number;

  @ValidateIf((o: AddCartItemDto) => o.itemType === 'menu')
  @IsNumber({}, { message: 'menuId invalide' })
  @IsNotEmpty({ message: 'menuId requis pour un item de type menu' })
  menuId?: number;

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

  @IsOptional()
  menuChoices?: {
    sandwich?: number;
    drink?: number;
    dessert?: number;
    side?: number;
  };

  @IsString({ message: 'Instructions spéciales invalides' })
  @IsOptional()
  specialInstructions?: string;
}
