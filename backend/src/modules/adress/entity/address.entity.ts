import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { Order } from '../../order/entity/order.entity';

/**
 * Entité représentant une adresse de livraison
 */
@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  street: string;

  @Column({ length: 10 })
  number: string;

  @Column({ length: 10, nullable: true })
  box: string; // Boîte/Appartement (ex: "B12", "Apt 3")

  @Column({ length: 4 })
  postalCode: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100, default: 'Belgium' })
  country: string;

  @Column({ length: 255, nullable: true })
  complement: string; // Instructions de livraison (digicode, étage, etc.)

  @Column({ length: 50, nullable: true })
  label: string;

  @Column({ default: false })
  isDefault: boolean; // Adresse par défaut

  // Relation avec User
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  // Relation avec Order
  @OneToMany(() => Order, (order) => order.deliveryAddress)
  orders: Order[];

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
