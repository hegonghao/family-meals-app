import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Dish } from './entities/dish.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishesRepository: Repository<Dish>,
  ) {}

  async createDish(dto: CreateDishDto) {
    const dish = this.dishesRepository.create({
      name: dto.name,
      slot: dto.slot,
      isActive: dto.isActive ?? true,
    });
    return this.dishesRepository.save(dish);
  }

  findAllDishes(slot?: MealSlot, includeInactive = false) {
    const order = { slot: 'ASC' as const, name: 'ASC' as const };
    const where: FindOptionsWhere<Dish> = {};
    if (slot) {
      where.slot = slot;
    }
    if (!includeInactive) {
      where.isActive = true;
    }
    return this.dishesRepository.find({ where, order });
  }

  async updateDish(id: string, dto: UpdateDishDto) {
    const dish = await this.dishesRepository.findOne({ where: { id } });
    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dto.name !== undefined) {
      dish.name = dto.name;
    }
    if (dto.slot !== undefined) {
      dish.slot = dto.slot;
    }
    if (dto.isActive !== undefined) {
      dish.isActive = dto.isActive;
    }

    return this.dishesRepository.save(dish);
  }

  async removeDish(id: string) {
    const dish = await this.dishesRepository.findOne({
      where: { id },
      relations: ['orderItems', 'orderItems.order']
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    // Check if dish has associated order items in today or future orders (only count non-cancelled orders)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasFutureOrderItems = dish.orderItems?.some(item => {
      if (!item.order || !item.order.id || item.order.status === 'CANCELLED') {
        return false;
      }
      const mealDate = new Date(item.order.mealDate);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate >= today;
    });

    if (hasFutureOrderItems) {
      // Instead of deleting, set as inactive
      dish.isActive = false;
      await this.dishesRepository.save(dish);
      return {
        success: true,
        message: 'Dish has been archived (it is used in current or future orders)',
        archived: true
      };
    }

    // If no future order items, safe to delete
    await this.dishesRepository.remove(dish);
    return { success: true, message: 'Dish deleted successfully', archived: false };
  }


  async getMenuBySlot(slot: MealSlot) {
    return this.dishesRepository.find({
      where: { slot, isActive: true },
      order: { name: 'ASC' },
    });
  }
}
