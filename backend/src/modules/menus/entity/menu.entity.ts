import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entity/product.entity';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true, length: 255 })
  description?: string;

  @Column('decimal', { precision: 6, scale: 2 })
  price: number;

  @ManyToMany(() => Product, { eager: true })
  @JoinTable()
  products: Product[];

  @Column({ type: 'date', nullable: true })
  availableFrom?: Date;

  @Column({ type: 'date', nullable: true })
  availableTo?: Date;

  @Column({ default: true })
  isActive: boolean;
}
