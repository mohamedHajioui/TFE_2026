import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from '../../products/entity/product.entity';
import { Ingredient } from '../../ingredients/entity/ingredient.entity';

@Entity()
export class ProductIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.productIngredients, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients, {
    onDelete: 'CASCADE',
  })
  ingredient: Ingredient;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // Quantité utilisée par défaut (ex: 2 tranches de jambon)

  @Column({ length: 50, nullable: true })
  unit: string; // 'tranches', 'grammes', 'ml', 'pièces'

  @Column({ default: true })
  isRequired: boolean; // true = ingrédient de base, false = optionnel/supplément

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  extraPrice: number; // Prix si ajouté en supplément (0 si de base)
}
