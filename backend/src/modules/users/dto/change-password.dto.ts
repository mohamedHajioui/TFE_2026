import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * DTO pour changer le mot de passe
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe actuel requis' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @MinLength(8, { message: 'Mot de passe trop court (minimum 8 caractères)' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Mot de passe trop faible (doit contenir : majuscule, minuscule, chiffre)',
  })
  newPassword: string;
}
