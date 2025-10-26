import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials', description: 'Validate the provided login details and return a JWT token when successful.' })
  @ApiResponse({ status: 200, description: 'The user has been authenticated successfully.' })
  @ApiResponse({ status: 201, description: 'The user has been authenticated successfully.' })
  @ApiResponse({ status: 400, description: 'The request body failed validation.' })
  @ApiResponse({ status: 401, description: 'The credentials provided are invalid.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
