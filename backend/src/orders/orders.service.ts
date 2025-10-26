import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Dish } from '../menu/entities/dish.entity';
import { User } from '../users/entities/user.entity';
import { Between, FindOptionsWhere, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateOrderDto, OrderItemInput } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderItemInput } from './dto/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private ensureDateNotPast(mealDate: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${mealDate}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid meal date format');
    }
    if (targetDate.getTime() < today.getTime()) {
      throw new BadRequestException('Meal date has already passed');
    }
  }

  private ensureOwnership(order: Order, userId?: string) {
    if (userId && order.user?.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this order');
    }
  }

  private assertNoDuplicates(dishIds: string[]) {
    const seen = new Set<string>();
    for (const id of dishIds) {
      if (seen.has(id)) {
        throw new BadRequestException('Duplicate dishes within the same order');
      }
      seen.add(id);
    }
  }

  private async ensureSelectionsAreUnique(
    userId: string,
    mealDate: string,
    slot: MealSlot,
    dishIds: string[],
    excludeOrderId?: string,
  ) {
    if (!dishIds.length) {
      return;
    }

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.dish', 'dish')
      .where('order.userId = :userId', { userId })
      .andWhere('order.mealDate = :mealDate', { mealDate })
      .andWhere('order.slot = :slot', { slot })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('dish.id IN (:...dishIds)', { dishIds });

    if (excludeOrderId) {
      qb.andWhere('order.id != :excludeOrderId', { excludeOrderId });
    }

    const conflicting = await qb.getCount();
    if (conflicting > 0) {
      throw new BadRequestException('Dish already ordered for this user and meal');
    }
  }

  private async resolveItems(slot: MealSlot, itemDtos: (OrderItemInput | UpdateOrderItemInput)[]) {
    const items: OrderItem[] = [];
    for (const input of itemDtos) {
      const dishId = input.dishId;
      if (!dishId) {
        throw new BadRequestException('Dish ID is required');
      }
      const dish = await this.dishRepository.findOne({ where: { id: dishId } });
      if (!dish || !dish.isActive) {
        throw new NotFoundException('Dish not found or inactive');
      }
      if (dish.slot !== slot) {
        throw new BadRequestException('Meal slot does not match dish');
      }
      const quantity = input.quantity ?? 1;
      const orderItem = this.orderItemsRepository.create({
        dish,
        dishName: dish.name,
        quantity,
        specialInstruction: input.specialInstruction,
      });
      items.push(orderItem);
    }
    return items;
  }

  async create(dto: CreateOrderDto) {
    this.ensureDateNotPast(dto.mealDate);

    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const items = await this.resolveItems(dto.slot, dto.items);
    const dishIds = items.map((item) => item.dish!.id);
    this.assertNoDuplicates(dishIds);
    await this.ensureSelectionsAreUnique(user.id, dto.mealDate, dto.slot, dishIds);

    const order = this.ordersRepository.create({
      user,
      mealDate: dto.mealDate,
      slot: dto.slot,
      notes: dto.notes,
      status: OrderStatus.PENDING,
      items,
    });

    return this.ordersRepository.save(order);
  }

  findUpcoming() {
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10);
    return this.ordersRepository.find({
      where: { mealDate: MoreThanOrEqual(isoDate) },
      order: { mealDate: 'ASC', slot: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByRange(startDate: string, endDate: string, slot?: MealSlot) {
    const where = { mealDate: Between(startDate, endDate) } as FindOptionsWhere<Order>;
    if (slot) {
      where.slot = slot;
    }
    return this.ordersRepository.find({
      where,
      order: { mealDate: 'ASC', slot: 'ASC', createdAt: 'ASC' },
    });
  }
  async findByDate(date: string, slot?: MealSlot, userId?: string) {
    const where: FindOptionsWhere<Order> = { mealDate: date };
    if (slot) {
      where.slot = slot;
    }
    if (userId) {
      where.user = { id: userId } as any;
    }
    return this.ordersRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, requestingUserId?: string) {
    const order = await this.ordersRepository.findOne({ where: { id }, relations: ['items', 'items.dish', 'user'] });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.ensureOwnership(order, requestingUserId);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, requestingUserId?: string) {
    const order = await this.findOne(id, requestingUserId);

    const effectiveDate = dto.mealDate ?? order.mealDate;
    this.ensureDateNotPast(effectiveDate);

    if (dto.mealDate) {
      order.mealDate = dto.mealDate;
    }
    if (dto.slot) {
      order.slot = dto.slot;
    }
    if (dto.notes !== undefined) {
      order.notes = dto.notes;
    }
    if (dto.status) {
      order.status = dto.status;
    }

    if (dto.items) {
      const items = await this.resolveItems(order.slot, dto.items);
      const dishIds = items.map((item) => item.dish!.id);
      this.assertNoDuplicates(dishIds);
      await this.ensureSelectionsAreUnique(order.user.id, order.mealDate, order.slot, dishIds, order.id);
      order.items = items;
    }

    return this.ordersRepository.save(order);
  }

  async cancel(id: string, requestingUserId?: string) {
    const order = await this.findOne(id, requestingUserId);
    this.ensureDateNotPast(order.mealDate);
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepository.save(order);
  }
}
