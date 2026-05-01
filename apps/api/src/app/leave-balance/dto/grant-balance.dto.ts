import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class GrantBalanceDto {
  @ApiProperty({ example: 'ANNUAL' })
  @IsString()
  leaveType!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'Annual allocation' })
  @IsOptional()
  @IsString()
  note?: string;
}
