import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { Product } from '../../products/entity/product.entity';
import { Order } from '../../order/entity/order.entity';
import { Menu } from '../../menus/entity/menu.entity';

export interface MenuChoices {
  sandwich?: number;
  drink?: number;
  dessert?: number;
  side?: number;
}

export interface ProductCustomization {
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

  // Type d'item : 'product' ou 'menu'
  @Column({
    type: 'enum',
    enum: ['product', 'menu'],
  })
  itemType: 'product' | 'menu';

  // Référence à un Product (si itemType = 'product')
  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  product: Product | null;

  // Référence à un Menu (si itemType = 'menu')
  @ManyToOne(() => Menu, { onDelete: 'SET NULL', nullable: true })
  menu: Menu | null;

  // Pour les menus : choix du client
  @Column({ type: 'json', nullable: true })
  menuChoices: MenuChoices | null;

  // Pour les produits : personnalisations
  @Column({ type: 'json', nullable: true })
  customization: ProductCustomization | null;

  @Column({ nullable: true })
  specialInstructions: string; // "Sans oignons", "Bien cuit", etc.

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;
}
