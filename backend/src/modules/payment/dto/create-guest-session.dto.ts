import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateGuestCheckoutSessionDto {
  @IsNumber({}, { message: 'ID de commande invalide' })
  @IsNotEmpty({ message: 'ID de commande requis' })
  orderId: number;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Token invité invalide' })
  @IsNotEmpty({ message: 'Token invité requis' })
  guestToken: string;
}
