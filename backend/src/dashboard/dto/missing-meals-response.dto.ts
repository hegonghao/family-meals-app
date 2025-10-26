import { ApiProperty } from '@nestjs/swagger';
import { MealSlot } from '../../common/enums/meal-slot.enum';

export class MissingMealsDto {
  @ApiProperty({
    description: 'The target date being checked (tomorrow)',
    example: '2025-10-22',
    format: 'date',
  })
  targetDate!: string;

  @ApiProperty({
    description: 'Array of meal slots that have NOT been ordered',
    enum: MealSlot,
    isArray: true,
    example: [MealSlot.BREAKFAST, MealSlot.LUNCH],
  })
  missingSlots!: MealSlot[];

  @ApiProperty({
    description: 'True if all three meals are ordered, false otherwise',
    example: false,
  })
  allOrdered!: boolean;
}
