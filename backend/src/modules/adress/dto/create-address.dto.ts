import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Rue requise' })
  @MaxLength(255)
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'Numéro requis' })
  @MaxLength(10)
  number: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  box?: string;

  @IsString()
  @IsNotEmpty({ message: 'Code postal requis' })
  @Matches(/^\d{4}$/, { message: 'Code postal belge invalide (4 chiffres)' })
  postalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Ville requise' })
  @MaxLength(100)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string; // Par défaut "Belgium"

  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string; // Digicode, étage, etc.

  @IsString()
  @IsOptional()
  @MaxLength(50)
  label?: string; // "Maison", "Travail", etc.

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}
