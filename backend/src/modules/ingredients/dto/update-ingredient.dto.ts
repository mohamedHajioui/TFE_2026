import { PartialType } from '@nestjs/mapped-types';
import { CreateIngredientDto } from './create-ingredient.dto';

/**
 * DTO pour modifier un ingrédient
 * Tous les champs deviennent optionnels
 */
export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}
