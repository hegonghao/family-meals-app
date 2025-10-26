import { MealSlot } from '../../common/enums/meal-slot.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Dish } from '../../menu/entities/dish.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.orders, { eager: true })
  user!: User;

  @Column({ type: 'date' })
  mealDate!: string;

  @Column({ type: 'enum', enum: MealSlot })
  slot!: MealSlot;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true, orphanedRowAction: 'delete' })
  items!: OrderItem[];

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
