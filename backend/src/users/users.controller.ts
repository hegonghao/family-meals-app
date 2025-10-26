import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPreferenceDto } from './dto/update-user-preference.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPreferenceDto } from './dto/user-preference.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with the provided credentials.' })
  @ApiResponse({ status: 201, description: 'The user account has been created.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the supplied data.' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Retrieve all users', description: 'Return a list containing every user in the system. Admin only.' })
  @ApiResponse({ status: 200, description: 'The list of users has been retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Update authenticated user profile',
    description: 'Allows the currently logged in user to change their display name or password after confirming the existing password.',
  })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed or current password is incorrect.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  async updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.userId;
    return this.usersService.updateOwnProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user', description: 'Modify profile details or credentials for the specified user. Admin only.' })
  @ApiResponse({ status: 200, description: 'The user record has been updated.' })
  @ApiResponse({ status: 400, description: 'Validation failed for the supplied data.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (Admin only)', description: 'Delete a non-admin user from the system.' })
  @ApiResponse({ status: 200, description: 'The user has been deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot delete admin users.' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'User does not have admin role.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  @ApiOperation({
    summary: 'Get user preferences',
    description: 'Retrieves the authenticated user\'s preferences including reminder settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user preferences',
    type: UserPreferenceDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User preferences not found (should be auto-created on user registration)' })
  async getPreferences(@Request() req: any): Promise<UserPreferenceDto> {
    const userId = req.user.userId; // JWT payload contains userId
    return this.usersService.getPreferences(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  @ApiOperation({
    summary: 'Update user preferences',
    description: 'Updates the authenticated user\'s preferences (e.g., toggle reminder on/off)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated user preferences',
    type: UserPreferenceDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body (validation failed)' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async updatePreferences(
    @Request() req: any,
    @Body() dto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceDto> {
    const userId = req.user.userId; // JWT payload contains userId
    return this.usersService.updatePreferences(userId, dto);
  }
}



