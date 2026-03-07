import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';

/**
 * DTO pour modifier un menu
 * Tous les champs deviennent optionnels
 */
export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
