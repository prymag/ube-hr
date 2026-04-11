import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Core engineering team' })
  @IsOptional()
  @IsString()
  description?: string;
}
