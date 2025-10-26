import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MealSlot } from '../../common/enums/meal-slot.enum';

export class CreateDishDto {
  @ApiProperty({ description: 'Human-readable name of the dish.', example: 'Grandma\'s Lasagna' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Meal slot during which the dish is available.', enum: MealSlot, example: MealSlot.DINNER })
  @IsEnum(MealSlot)
  slot!: MealSlot;

  @ApiProperty({ description: 'Indicates whether the dish is active and shown to users.', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
