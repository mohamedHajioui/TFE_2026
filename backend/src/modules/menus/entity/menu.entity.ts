import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entity/product.entity';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column('decimal', { precision: 6, scale: 2 })
  price: number;

  @ManyToMany(() => Product, (product) => product.menus)
  @JoinTable({
    name: 'menu_products',
    joinColumn: {
      name: 'menu_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
  })
  allowedProducts: Product[];

  // Configuration du menu (combien de chaque catégorie)
  @Column({ type: 'json' })
  configuration: {
    sandwich: { required: boolean; quantity: number }; // Ex: 1 sandwich obligatoire
    drink: { required: boolean; quantity: number }; // Ex: 1 boisson obligatoire
    dessert: { required: boolean; quantity: number }; // Ex: 1 dessert optionnel
    side: { required: boolean; quantity: number }; // Ex: 0 accompagnement
  };

  @Column({ nullable: true })
  availableFrom: string; // Format "YYYY-MM-DD"

  @Column({ nullable: true })
  availableTo: string; // Format "YYYY-MM-DD"

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
