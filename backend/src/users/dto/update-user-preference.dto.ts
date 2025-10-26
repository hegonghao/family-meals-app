import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserPreferenceDto {
  @ApiProperty({
    description: 'Toggle meal reminders on/off',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;
}
