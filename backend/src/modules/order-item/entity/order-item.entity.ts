import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { Product } from '../../products/entity/product.entity';
import { Order } from '../../order/entity/order.entity';

export interface SandwichCustomization {
  removed?: number[];
  extra?: {
    ingredientId: number;
    quantity: number;
  }[];
  breadType?: string;
  notes?: string;
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'json', nullable: true })
  customization: SandwichCustomization; // Pour les sandwichs personnalisés (pain, garnitures, etc.)

  @Column({ nullable: true })
  specialInstructions: string; // "Sans oignons", "Bien cuit", etc.

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  product: Product;
}
