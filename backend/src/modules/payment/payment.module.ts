import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Order } from '../order/entity/order.entity';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { NotificationService } from '../../common/services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, TimeSlot, OrderItem])],
  controllers: [PaymentController],
  providers: [PaymentService, NotificationService],
  exports: [PaymentService],
})
export class PaymentModule {}
