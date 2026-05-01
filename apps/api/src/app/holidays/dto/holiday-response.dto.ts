import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HolidayResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "New Year's Day" })
  name!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  date!: string;

  @ApiPropertyOptional({ example: 'National public holiday', nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
