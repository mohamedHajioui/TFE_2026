import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entity/cart-item.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Product } from '../products/entity/product.entity';
import { Menu } from '../menus/entity/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, Product, Menu])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
