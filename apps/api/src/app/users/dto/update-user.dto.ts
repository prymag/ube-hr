import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '@ube-hr/backend';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User role', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Profile picture (send "null" to remove)',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
