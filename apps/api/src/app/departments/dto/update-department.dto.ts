import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  IsInt,
  IsPositive,
} from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    example: 'Builds and maintains products',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'User ID of the department head (null to remove)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  headId?: number | null;
}
