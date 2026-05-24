import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
} from 'typeorm';
import { Address } from '../../adress/entity/address.entity';
import { Order } from '../../order/entity/order.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ length: 100 })
  displayName: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  googleId: string | null;

  hasPassword: boolean;

  @AfterLoad()
  setHasPassword() {
    this.hasPassword = this.passwordHash !== null && this.passwordHash !== undefined;
  }

  /**
   * Exclut passwordHash et googleId des réponses JSON.
   */
  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, googleId, ...rest } = this as Record<string, unknown>;
    return rest;
  }
}
