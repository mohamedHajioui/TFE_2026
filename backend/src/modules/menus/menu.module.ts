import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Menu } from './entity/menu.entity';
import { Product } from '../products/entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Product])],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
