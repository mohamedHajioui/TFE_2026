import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateGuestCheckoutSessionDto {
  @IsNumber({}, { message: 'ID de commande invalide' })
  @IsNotEmpty({ message: 'ID de commande requis' })
  orderId: number;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
}
