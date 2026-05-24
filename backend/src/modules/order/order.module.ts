import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../products/entity/product.entity';
import { Menu } from '../menus/entity/menu.entity';
import { User } from '../users/entity/user.entity';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { Address } from '../adress/entity/address.entity';
import { SettingsModule } from '../settings/settings.module';
import { NotificationService } from '../../common/services/notification.service';
import { IngredientModule } from '../ingredients/ingredient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      Menu,
      TimeSlot,
      Address,
      User,
    ]),
    SettingsModule,
    IngredientModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, NotificationService],
  exports: [OrderService],
})
export class OrderModule {}
