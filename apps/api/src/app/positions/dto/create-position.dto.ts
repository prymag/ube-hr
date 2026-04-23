import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Develops software systems' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of the position this role reports to' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  reportsToId?: number;
}
