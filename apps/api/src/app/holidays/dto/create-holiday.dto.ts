import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ example: "New Year's Day" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'National public holiday' })
  @IsOptional()
  @IsString()
  description?: string;
}
