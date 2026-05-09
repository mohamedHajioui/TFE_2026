import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

/**
 * DTO pour modifier un utilisateur
 */
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+32|0)[1-9]\d{7,8}$/, {
    message: 'Numéro de téléphone belge invalide',
  })
  phoneNumber?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
