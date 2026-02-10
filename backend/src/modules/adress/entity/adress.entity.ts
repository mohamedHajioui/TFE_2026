import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { Order } from '../../order/entity/order.entity';


@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  street: string;

  @Column()
  number: string;

  @Column()
  postalCode: string;

  @Column()
  city: string;

  @Column({ default: 'Belgium' })
  country: string;

  @Column({ nullable: true })
  complement: string; // Instructions de livraison

  @Column({ nullable: true })
  label: string; // Maison, Travail, etc.

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Order, (order) => order.deliveryAddress)
  orders: Order[];
}
