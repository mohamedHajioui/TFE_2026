import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';

import { TimeSlot } from '../../time-slot/entity/time-slot.entity';
import { Address } from '../../adress/entity/address.entity';
import { OrderItem } from '../../order-item/entity/order-item.entity';


export enum OrderStatus {
  PENDING = 'PENDING', // En attente de confirmation
  CONFIRMED = 'CONFIRMED', // Confirmée
  IN_PREPARATION = 'IN_PREPARATION', // En préparation
  READY = 'READY', // Prête pour retrait/livraison
  IN_DELIVERY = 'IN_DELIVERY', // En cours de livraison
  COMPLETED = 'COMPLETED', // Terminée
  CANCELLED = 'CANCELLED', // Annulée
}

export enum OrderType {
  PICKUP = 'PICKUP', // Retrait sur place
  DELIVERY = 'DELIVERY', // Livraison
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string; // Ex: "CMD-20250210-001"

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number; // Total sans frais de livraison

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryFee: number; // Frais de livraison

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // Total final

  @Column({ nullable: true, type: 'text' })
  customerNote: string; // Notes du client

  @Column({ nullable: true, type: 'text' })
  internalNote: string; // Notes internes (cuisine/gestion)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  // Relations

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => Address, (address) => address.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  deliveryAddress: Address; // Null si retrait sur place

  @ManyToOne(() => TimeSlot, (timeSlot) => timeSlot.orders, {
    onDelete: 'SET NULL',
  })
  timeSlot: TimeSlot; // Créneau horaire de retrait/livraison

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItem[];
}
