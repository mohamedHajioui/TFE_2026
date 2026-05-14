import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Menu } from '../../menus/entity/menu.entity';
import { ProductIngredient } from '../../product-ingredients/entity/product-ingredient.entity';

export enum ProductCategory {
  SANDWICH = 'SANDWICH',
  DRINK = 'DRINK',
  DESSERT = 'DESSERT',
  SIDE = 'SIDE', // Accompagnements (frites, salades)
  SAUCE = 'SAUCE',
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

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column('decimal', { precision: 6, scale: 2 })
  basePrice: number; // Prix de base (avant suppléments)

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isCustomizable: boolean; // true pour sandwichs personnalisables

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductIngredient, (pi) => pi.product, {
    cascade: true,
  })
  productIngredients: ProductIngredient[];

  @ManyToMany(() => Menu, (menu) => menu.allowedProducts)
  menus: Menu[];
}
