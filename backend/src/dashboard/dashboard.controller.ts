import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MissingMealsDto } from './dto/missing-meals-response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('missing-meals')
  @ApiOperation({
    summary: 'Check missing meals for next day',
    description:
      'Checks which meal slots (Breakfast, Lunch, Dinner) the authenticated user has NOT ordered for the next day. Returns an array of missing meal slots. Empty array means all meals are ordered.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved missing meals status',
    type: MissingMealsDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async getMissingMeals(@Request() req: any): Promise<MissingMealsDto> {
    const userId = req.user.userId; // JWT payload contains userId
    return this.dashboardService.getMissingMeals(userId);
  }
}
