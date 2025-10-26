import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { MenuService } from './menu.service';

@ApiTags('menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('dishes')
  @ApiOperation({ summary: 'Create a new dish (Admin only)', description: 'Add a dish to the menu for the specified meal slot.' })
  @ApiResponse({ status: 201, description: 'The dish has been created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the provided dish information.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  createDish(@Body() dto: CreateDishDto) {
    return this.menuService.createDish(dto);
  }

  @Get('dishes')
  @ApiOperation({ summary: 'List dishes', description: 'Fetch dishes optionally filtered by meal slot and activity state.' })
  @ApiResponse({ status: 200, description: 'The dishes have been retrieved successfully.' })
  @ApiQuery({
    name: 'slot',
    enum: MealSlot,
    required: false,
    description: 'Filter dishes by meal slot',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Set to true to include inactive dishes.',
    example: 'true',
  })
  getDishes(
    @Query('slot', new ParseEnumPipe(MealSlot, { optional: true })) slot?: MealSlot,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true' || includeInactive === '1';
    return this.menuService.findAllDishes(slot, include);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('dishes/:id')
  @ApiOperation({ summary: 'Update a dish (Admin only)', description: 'Modify the details of an existing dish.' })
  @ApiResponse({ status: 200, description: 'The dish has been updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the provided dish information.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  updateDish(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.menuService.updateDish(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('dishes/:id')
  @ApiOperation({ summary: 'Remove a dish (Admin only)', description: 'Delete the specified dish from the menu.' })
  @ApiResponse({ status: 200, description: 'The dish has been removed successfully.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  removeDish(@Param('id') id: string) {
    return this.menuService.removeDish(id);
  }

  @Get('slots/:slot')
  @ApiOperation({ summary: 'Get menu by slot', description: 'Retrieve the menu entries for the provided meal slot.' })
  @ApiResponse({ status: 200, description: 'The menu for the specified slot has been retrieved successfully.' })
  getMenuBySlot(@Param('slot', new ParseEnumPipe(MealSlot)) slot: MealSlot) {
    return this.menuService.getMenuBySlot(slot);
  }
}
