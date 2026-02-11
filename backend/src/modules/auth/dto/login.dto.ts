import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO pour la connexion d'un utilisateur
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(6, { message: 'Mot de passe trop court (minimum 6 caractères)' })
  password: string;
}
