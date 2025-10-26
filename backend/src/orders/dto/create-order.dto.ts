import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MealSlot } from '../../common/enums/meal-slot.enum';

export class OrderItemInput {
  @ApiProperty({ description: 'Identifier of the dish to include in the order.', example: 'dish_123abc' })
  @IsString()
  dishId!: string;

  @ApiProperty({ description: 'Quantity requested for the dish.', example: 2, minimum: 1 })
  @Type(() => Number)
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Optional special instructions for the dish.', example: 'Extra cheese on top', required: false })
  @IsOptional()
  @IsString()
  specialInstruction?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Identifier of the user placing the order.', example: 'user_456xyz' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Date for which the meal is scheduled.', example: '2025-10-15' })
  @IsDateString()
  mealDate!: string;

  @ApiProperty({ description: 'Meal slot for the order.', enum: MealSlot, example: MealSlot.LUNCH })
  @IsEnum(MealSlot)
  slot!: MealSlot;

  @ApiProperty({ description: 'Optional notes associated with the order.', example: 'Deliver to the back door', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Line items included in the order.', type: () => OrderItemInput, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];
}
