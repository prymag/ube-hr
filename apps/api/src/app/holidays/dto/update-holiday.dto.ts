import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class UpdateHolidayDto {
  @ApiPropertyOptional({ example: "New Year's Day" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'National public holiday', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}
