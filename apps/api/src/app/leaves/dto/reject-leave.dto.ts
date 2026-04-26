import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectLeaveDto {
  @ApiProperty({ description: 'Required reason for rejection' })
  @IsString()
  @MinLength(1)
  comment!: string;
}
