import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString({ message: 'La valeur doit être une chaîne' })
  @IsNotEmpty({ message: 'Valeur requise' })
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}
