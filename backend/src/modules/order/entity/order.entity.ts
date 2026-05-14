import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { OrderItem } from '../../order-item/entity/order-item.entity';
import { TimeSlot } from '../../time-slot/entity/time-slot.entity';
import { Address } from '../../adress/entity/address.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  IN_DELIVERY = 'IN_DELIVERY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
@Index(['orderNumber'])
@Index(['user', 'status'])
@Index(['guestEmail']) // pour retrouver rapidement les commandes d'un invité revenant
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  orderNumber: string;

  @Column({ type: 'enum', enum: OrderType })
  type: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true, type: 'text' })
  customerNote: string;

  @Column({ nullable: true, type: 'text' })
  internalNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt: Date;

  // ─── Relations (user connecté) ───

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: User | null;

  @ManyToOne(() => Address, (address) => address.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  deliveryAddress: Address | null;

  @ManyToOne(() => TimeSlot, (timeSlot) => timeSlot.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  timeSlot: TimeSlot;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  // ─── Champs INVITÉ (guest checkout) ───
  // Renseignés uniquement si `user` est null (commande sans compte).
  // On stocke tout sur la commande elle-même pour qu'elle soit autosuffisante.

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestEmail: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestName: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  guestPhone: string | null;

  // Adresse de livraison inline pour invités (si DELIVERY).
  @Column({ type: 'varchar', length: 255, nullable: true })
  guestStreet: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  guestNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  guestBox: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  guestPostalCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestCity: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestCountry: string | null;

  @Column({ type: 'text', nullable: true })
  guestAddressComplement: string | null;
}
