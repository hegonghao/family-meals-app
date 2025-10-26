import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { MissingMealsDto } from './dto/missing-meals-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * Check which meal slots (Breakfast, Lunch, Dinner) the user has NOT ordered for next day
   * Returns array of missing meal slots. Empty array means all meals are ordered.
   */
  async getMissingMeals(userId: string): Promise<MissingMealsDto> {
    // Calculate next day date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Query all ACTIVE orders (not cancelled) for the user on target date
    const existingOrders = await this.orderRepository.find({
      where: {
        user: { id: userId },
        mealDate: targetDate,
        status: In([OrderStatus.PENDING, OrderStatus.CONFIRMED]),
      },
      select: ['slot'],
    });

    // Extract ordered slots
    const orderedSlots = new Set(existingOrders.map((order) => order.slot));

    // All possible meal slots
    const allSlots = [MealSlot.BREAKFAST, MealSlot.LUNCH, MealSlot.DINNER];

    // Find missing slots
    const missingSlots = allSlots.filter((slot) => !orderedSlots.has(slot));

    return {
      targetDate,
      missingSlots,
      allOrdered: missingSlots.length === 0,
    };
  }
}
