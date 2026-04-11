import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  userId!: number;
}
