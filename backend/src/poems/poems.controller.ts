import { Controller, Get, ParseEnumPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoemCategory } from '../common/enums/poem-category.enum';
import { PoemsResponseDto } from './dto/poem-response.dto';
import { PoemsService } from './poems.service';

@ApiTags('poems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('poems')
export class PoemsController {
  constructor(private readonly poemsService: PoemsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all active poems',
    description:
      'Retrieves list of all active poems. Frontend will perform random selection with 30% refresh probability.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved poems list',
    type: PoemsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiQuery({
    name: 'category',
    enum: PoemCategory,
    required: false,
    description: 'Filter poems by category (optional)',
  })
  async getAll(
    @Query('category', new ParseEnumPipe(PoemCategory, { optional: true }))
    category?: PoemCategory,
  ): Promise<PoemsResponseDto> {
    return this.poemsService.findAll(category);
  }
}
