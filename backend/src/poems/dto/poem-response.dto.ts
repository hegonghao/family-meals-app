import { ApiProperty } from '@nestjs/swagger';
import { PoemCategory } from '../../common/enums/poem-category.enum';

export class PoemDto {
  @ApiProperty({
    description: 'Poem unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Poem text content (10-30 characters)',
    example: '粗茶淡饭,知足常乐',
    minLength: 10,
    maxLength: 30,
  })
  text!: string;

  @ApiProperty({
    description: 'Poem category',
    enum: PoemCategory,
    example: PoemCategory.GENERAL,
  })
  category!: PoemCategory;

  @ApiProperty({
    description: 'Display weight (higher = higher probability)',
    example: 1,
    minimum: 1,
  })
  weight!: number;
}

export class PoemsResponseDto {
  @ApiProperty({
    description: 'List of active poems',
    type: [PoemDto],
  })
  data!: PoemDto[];

  @ApiProperty({
    description: 'Total number of poems',
    example: 20,
  })
  total!: number;
}
