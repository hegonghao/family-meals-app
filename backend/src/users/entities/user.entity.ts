import { UserRole } from '../../common/enums/user-role.enum';
import { Order } from '../../orders/entities/order.entity';
import { UserPreference } from './user-preference.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ length: 100 })
  displayName!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToOne(() => UserPreference, (preference) => preference.user, { cascade: true })
  preference!: UserPreference;
}
