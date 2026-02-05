import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Menu } from '../../menus/entity/menu.entity';
import { Ingredient } from '../../ingredients/entity/ingredient.entity';


export enum ProductCategory {
  SANDWICH = 'SANDWICH',
  DRINK = 'DRINK',
  DESSERT = 'DESSERT',
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
  })
  category: ProductCategory;

  @Column({ nullable: true, length: 255 })
  description?: string;

  @Column('decimal', { precision: 6, scale: 2 })
  price: number;

  @ManyToMany(() => Ingredient)
  @JoinTable()
  ingredients: Ingredient[];

  @ManyToMany(() => Menu, (menu) => menu.products)
  menus: Menu[];

  @Column({ default: true })
  isActive: boolean;
}
