import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateMyProfileDto {
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
}
