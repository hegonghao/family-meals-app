import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MealSlot } from '../../common/enums/meal-slot.enum';

export class UpdateDishDto {
  @ApiProperty({ description: 'Updated dish name.', example: 'Vegan Shepherd\'s Pie', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Updated meal slot for the dish.', enum: MealSlot, example: MealSlot.LUNCH, required: false })
  @IsOptional()
  @IsEnum(MealSlot)
  slot?: MealSlot;

  @ApiProperty({ description: 'Flag to mark the dish as active or inactive.', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
