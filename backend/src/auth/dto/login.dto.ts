import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Unique username used to authenticate the user.', example: 'familychef' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-]{3,30}$/)
  username!: string;

  @ApiProperty({ description: 'Plain text password for the user account.', example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
