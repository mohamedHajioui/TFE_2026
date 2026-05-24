import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { Ingredient } from './entity/ingredient.entity';
import { Product } from '../products/entity/product.entity';
import { ProductIngredient } from '../product-ingredients/entity/product-ingredient.entity';
import { Menu } from '../menus/entity/menu.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      Product,
      ProductIngredient,
      Menu,
      OrderItem,
    ]),
  ],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
})
export class IngredientModule {}
