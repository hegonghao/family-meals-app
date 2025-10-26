import { ApiProperty } from '@nestjs/swagger';

export class UserPreferenceDto {
  @ApiProperty({
    description: 'Preference record ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    description: 'Whether meal reminders are enabled',
    example: true,
  })
  remindersEnabled!: boolean;
}
