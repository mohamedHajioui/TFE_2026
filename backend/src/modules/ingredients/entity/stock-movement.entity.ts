import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

export enum StockMovementType {
  ADJUSTMENT = 'ADJUSTMENT',
  ORDER_DEDUCTION = 'ORDER_DEDUCTION',
  ORDER_RESTORE = 'ORDER_RESTORE',
}

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  ingredient: Ingredient;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  stockBefore: number;

  @Column('decimal', { precision: 10, scale: 2 })
  stockAfter: number;

  @Column({ nullable: true, type: 'text' })
  reason: string | null;

  @Column({ type: 'int', nullable: true })
  orderId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
