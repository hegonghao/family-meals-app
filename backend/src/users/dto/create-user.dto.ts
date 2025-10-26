import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique username for the user.', example: 'homecook42' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-]{3,30}$/)
  username!: string;

  @ApiProperty({ description: 'Optional display name presented to other users.', example: 'Home Cook Hero', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'Plain text password meeting minimum complexity requirements.', example: 'StrongPass!234' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'User role (admin or user). Defaults to user.',
    enum: UserRole,
    example: UserRole.USER,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
