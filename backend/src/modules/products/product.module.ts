import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { ProductIngredient } from '../product-ingredients/entity/product-ingredient.entity';
import { Ingredient } from '../ingredients/entity/ingredient.entity';
import { Menu } from '../menus/entity/menu.entity';

/**
 * Module gérant les produits
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductIngredient, Ingredient, Menu])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
