import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber({}, { message: 'Quantité invalide' })
  @IsNotEmpty({ message: 'Quantité requise' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity: number;
}
