import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RunAccrualDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
