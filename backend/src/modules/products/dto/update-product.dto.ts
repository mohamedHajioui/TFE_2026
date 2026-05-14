import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO pour modifier un produit
 * Tous les champs deviennent optionnels (grâce à PartialType)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
