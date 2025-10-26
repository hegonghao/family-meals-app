import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MealSlot } from '../../common/enums/meal-slot.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderItemInput {
  @ApiProperty({ description: 'Identifier of the dish included in the order line item.', example: 'dish_123abc', required: false })
  @IsOptional()
  @IsString()
  dishId?: string;

  @ApiProperty({ description: 'Updated quantity for the dish.', example: 3, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Updated special instruction for the dish.', example: 'No peanuts', required: false })
  @IsOptional()
  @IsString()
  specialInstruction?: string;
}

export class UpdateOrderDto {
  @ApiProperty({ description: 'Updated meal date for the order.', example: '2025-10-16', required: false })
  @IsOptional()
  @IsDateString()
  mealDate?: string;

  @ApiProperty({ description: 'Updated meal slot for the order.', enum: MealSlot, example: MealSlot.DINNER, required: false })
  @IsOptional()
  @IsEnum(MealSlot)
  slot?: MealSlot;

  @ApiProperty({ description: 'Updated status of the order.', enum: OrderStatus, example: OrderStatus.CONFIRMED, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Updated notes for the order.', example: 'Ring the doorbell twice', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Updated collection of order line items.', type: () => UpdateOrderItemInput, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemInput)
  items?: UpdateOrderItemInput[];
}
