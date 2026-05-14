import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsNumber({}, { message: 'ID de commande invalide' })
  @IsNotEmpty({ message: 'ID de commande requis' })
  orderId: number;
}
