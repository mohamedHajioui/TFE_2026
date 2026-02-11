import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour rafraichir le token
 */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  @IsString({ message: 'Le refresh token doit être une chaîne de caractères' })
  refreshToken: string;
}
