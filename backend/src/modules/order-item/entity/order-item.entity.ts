import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entity/product.entity';

import { Menu } from '../../menus/entity/menu.entity';
import { Order } from '../../order/entity/order.entity';

export interface MenuChoices {
  sandwich?: number;
  drink?: number;
  dessert?: number;
  side?: number;
}

export interface ProductCustomization {
  removed?: number[]; // IDs des ingrédients retirés
  extra?: number[]; // IDs des ingrédients ajoutés (simplifié)
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

  @Column({
    type: 'enum',
    enum: ['product', 'menu'],
    default: 'product',
  })
  itemType: 'product' | 'menu';

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  product: Product | null;

  @ManyToOne(() => Menu, { onDelete: 'SET NULL', nullable: true })
  menu: Menu | null;

  @Column({ type: 'json', nullable: true })
  menuChoices: MenuChoices | null;

  @Column({ type: 'json', nullable: true })
  customization: ProductCustomization | null;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
