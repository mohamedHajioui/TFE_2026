import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO pour l'inscription d'un nouvel utilisateur
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: "Nom d'utilisateur requis" })
  @MinLength(3, { message: 'Nom trop court (minimum 3 caractères)' })
  @MaxLength(100, { message: 'Nom trop long (maximum 100 caractères)' })
  displayName: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(8, { message: 'Mot de passe trop court (minimum 8 caractères)' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Mot de passe trop faible (doit contenir : majuscule, minuscule, chiffre)',
  })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+32|0)[1-9]\d{7,8}$/, {
    message: 'Numéro de téléphone belge invalide (format: +32... ou 0...)',
  })
  phoneNumber?: string;
}
