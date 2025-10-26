import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Updated display name for the current user.', example: '李四', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Current password for verification when setting a new password.',
    example: 'CurrentPass123!'
  })
  @ValidateIf((dto) => dto.newPassword !== undefined)
  @IsString()
  @MinLength(8)
  currentPassword?: string;

  @ApiProperty({
    description: 'New password that replaces the current one. Requires the current password to be provided.',
    example: 'NewSecurePass456!',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
