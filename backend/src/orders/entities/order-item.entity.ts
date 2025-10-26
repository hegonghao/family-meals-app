import { Dish } from '../../menu/entities/dish.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order!: Order;

  @ManyToOne(() => Dish, (dish) => dish.orderItems, { eager: true, nullable: true, onDelete: 'SET NULL' })
  dish!: Dish | null;

  @Column()
  dishName!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  specialInstruction?: string | null;
}
