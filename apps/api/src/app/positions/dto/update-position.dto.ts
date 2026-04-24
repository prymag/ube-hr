import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsInt, IsPositive, ValidateIf } from 'class-validator';

export class UpdatePositionDto {
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'Develops software systems', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true, description: 'ID of the position this role reports to (null to remove)' })
  @IsOptional()
  @ValidateIf((o) => o.reportsToId !== null)
  @IsInt()
  @IsPositive()
  reportsToId?: number | null;
}
