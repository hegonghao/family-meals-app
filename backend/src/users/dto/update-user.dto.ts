import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ description: 'Updated username for the user.', example: 'familychef', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-]{3,30}$/)
  username?: string;

  @ApiProperty({ description: 'Updated display name.', example: 'Family Chef', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'Updated password adhering to policy requirements.', example: 'NewStrongPass!567', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'Flag to activate or deactivate the user.', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'User role (admin or user).',
    enum: UserRole,
    example: UserRole.USER,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
