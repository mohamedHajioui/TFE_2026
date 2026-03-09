import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../products/entity/product.entity';
import { User } from '../users/entity/user.entity';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { Address } from '../adress/entity/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, // Entité principale
      OrderItem, // Lignes de commande
      Product, // Pour vérifier les produits
      TimeSlot, // Pour réserver les créneaux
      Address, // Pour les adresses de livraison
      User, // Pour les clients
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService], // Export si d'autres modules en ont besoin
})
export class OrderModule {}
