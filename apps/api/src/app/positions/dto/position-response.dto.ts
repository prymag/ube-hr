import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Software Engineer' })
  name!: string;

  @ApiPropertyOptional({ example: 'Develops software systems', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  reportsToId!: number | null;

  @ApiPropertyOptional({ example: 'Engineering Manager', nullable: true })
  reportsToName!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
