import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductIngredient } from '../../product-ingredients/entity/product-ingredient.entity';

export enum IngredientCategory {
  BREAD = 'BREAD', // Pains
  PROTEIN = 'PROTEIN', // Viandes, poissons
  CHEESE = 'CHEESE', // Fromages
  VEGETABLE = 'VEGETABLE', // Légumes
  SAUCE = 'SAUCE', // Sauces
  SEASONING = 'SEASONING', // Assaisonnements
  OTHER = 'OTHER', // Autres
}

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: IngredientCategory,
  })
  category: IngredientCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  currentStock: number; // Stock actuel (peut être décimal: 1.5 kg)

  @Column('decimal', { precision: 10, scale: 2 })
  minStock: number; // Seuil d'alerte

  @Column({ length: 50 })
  unit: string; // 'kg', 'litres', 'unités', 'tranches'

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  costPerUnit: number; // Prix d'achat par unité (pour calculer la marge)

  @Column({ default: true })
  isAvailable: boolean; // false si rupture de stock

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductIngredient, (pi) => pi.ingredient)
  productIngredients: ProductIngredient[];
}
