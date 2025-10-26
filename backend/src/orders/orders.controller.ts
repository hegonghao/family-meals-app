import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
type AuthenticatedRequest = Request & { user: { userId: string; username: string; displayName: string } };

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order', description: 'Submit a new meal order for the authenticated user.' })
  @ApiResponse({ status: 201, description: 'The order has been placed successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the order payload.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  create(@Body() dto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    dto.userId = req.user.userId;
    return this.ordersService.create(dto);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'List upcoming orders', description: 'Retrieve upcoming orders with scheduled delivery or pickup.' })
  @ApiResponse({ status: 200, description: 'Upcoming orders have been retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  findUpcoming() {
    return this.ordersService.findUpcoming();
  }

  @Get('calendar-range')
  @ApiOperation({ summary: 'Get orders within a range', description: 'Retrieve calendar view data for orders across a date range or month.' })
  @ApiResponse({ status: 200, description: 'Orders for the requested range have been retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or missing calendar query parameters.' })
  @ApiQuery({ name: 'month', required: false, description: 'Month in YYYY-MM format to retrieve orders for.' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date in YYYY-MM-DD format.' })
  @ApiQuery({ name: 'end', required: false, description: 'End date in YYYY-MM-DD format.' })
  @ApiQuery({ name: 'slot', required: false, enum: MealSlot, description: 'Filter by meal slot.' })
  getCalendar(
    @Query('month') month?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('slot') slot?: string,
  ) {
    let rangeStart: string | undefined;
    let rangeEnd: string | undefined;

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new BadRequestException('month must be formatted as YYYY-MM');
      }
      const [yearStr, monthStr] = month.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        throw new BadRequestException('month must be formatted as YYYY-MM');
      }
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      rangeStart = formatDate(startDate);
      rangeEnd = formatDate(endDate);
    } else if (start && end) {
      rangeStart = start;
      rangeEnd = end;
    } else {
      throw new BadRequestException('Provide either month=YYYY-MM or start/end query parameters');
    }

    if (!rangeStart || !rangeEnd) {
      throw new BadRequestException('Invalid date range');
    }

    let normalizedSlot: MealSlot | undefined;
    if (slot) {
      const upper = slot.toUpperCase() as MealSlot;
      if (!Object.values(MealSlot).includes(upper)) {
        throw new BadRequestException('Invalid slot value');
      }
      normalizedSlot = upper;
    }

    return this.ordersService.findByRange(rangeStart, rangeEnd, normalizedSlot);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Find orders for a date', description: 'Retrieve orders on a specific date, optionally filtered by slot or user.' })
  @ApiResponse({ status: 200, description: 'Orders for the specified date have been retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Missing or invalid query parameters.' })
  @ApiQuery({ name: 'date', required: true, description: 'Target date in YYYY-MM-DD format.' })
  @ApiQuery({ name: 'slot', required: false, enum: MealSlot, description: 'Filter by meal slot.' })
  @ApiQuery({ name: 'mine', required: false, description: 'Set to true to retrieve only your orders.', example: 'true' })
  findByDate(
    @Query('date') date: string,
    @Req() req: AuthenticatedRequest,
    @Query('slot') slot?: string,
    @Query('mine') mine = 'false',
  ) {
    if (!date) {
      throw new BadRequestException('date query is required');
    }
    const normalizedSlot = slot ? (slot.toUpperCase() as MealSlot) : undefined;
    if (normalizedSlot && !Object.values(MealSlot).includes(normalizedSlot)) {
      throw new BadRequestException('Invalid slot value');
    }
    const onlyMine = mine === 'true' || mine === '1';
    const userId = onlyMine ? req.user.userId : undefined;
    return this.ordersService.findByDate(date, normalizedSlot, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an order by id', description: 'Fetch a single order by its identifier.' })
  @ApiResponse({ status: 200, description: 'The order has been retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order', description: 'Modify the details of an existing order.' })
  @ApiResponse({ status: 200, description: 'The order has been updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the update payload.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.update(id, dto, req.user.userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order', description: 'Cancel an order that has been previously placed.' })
  @ApiResponse({ status: 200, description: 'The order has been cancelled successfully.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.cancel(id, req.user.userId);
  }
}


