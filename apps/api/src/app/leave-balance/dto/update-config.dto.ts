import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateAccrualConfigDto {
  @ApiProperty({ example: 1.25, description: 'Days credited per month' })
  @IsNumber()
  @Min(0)
  monthlyRate!: number;
}
