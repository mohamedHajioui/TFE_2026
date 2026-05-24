import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { Product } from '../../products/entity/product.entity';
import { Menu } from '../../menus/entity/menu.entity';
import type {
  ProductCustomization,
  MenuChoices,
} from '../../order-item/entity/order-item.entity';

@Entity()
@Index(['user'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column({
    type: 'enum',
    enum: ['product', 'menu'],
    default: 'product',
  })
  itemType: 'product' | 'menu';

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true, eager: false })
  product: Product | null;

  @ManyToOne(() => Menu, { onDelete: 'CASCADE', nullable: true, eager: false })
  menu: Menu | null;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'json', nullable: true })
  customization: ProductCustomization | null;

  @Column({ type: 'json', nullable: true })
  menuChoices: MenuChoices | null;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
