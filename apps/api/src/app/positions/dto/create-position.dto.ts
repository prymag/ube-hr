import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Develops software systems' })
  @IsOptional()
  @IsString()
  description?: string;
}
