import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Software Engineer' })
  name!: string;

  @ApiPropertyOptional({ example: 'Develops software systems', nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
