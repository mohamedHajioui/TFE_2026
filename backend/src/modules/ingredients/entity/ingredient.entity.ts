import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entity/product.entity';


@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'int' })
  currentStock: number;

  @Column({ type: 'int' })
  minStock: number;

  @Column({ type: 'int' })
  maxStock: number;

  @ManyToMany(() => Product, (product) => product.ingredients)
  products: Product[];
}
