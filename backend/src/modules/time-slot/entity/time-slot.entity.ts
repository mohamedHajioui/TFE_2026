import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../../order/entity/order.entity';


@Entity()
export class TimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string; // "12:00"

  @Column({ type: 'time' })
  endTime: string; // "12:30"

  @Column()
  maxCapacity: number; // Capacité maximale de commandes

  @Column({ default: 0 })
  currentBookings: number; // Nombre de commandes actuelles

  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(() => Order, (order) => order.timeSlot)
  orders: Order[];
}
