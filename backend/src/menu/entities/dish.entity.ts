import { MealSlot } from '../../common/enums/meal-slot.enum';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: MealSlot })
  slot!: MealSlot;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => OrderItem, (item) => item.dish)
  orderItems!: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
