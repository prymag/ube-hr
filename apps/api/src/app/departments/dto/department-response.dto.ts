import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Engineering' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Builds and maintains products',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  headId!: number | null;

  @ApiPropertyOptional({ example: 'Jane Doe', nullable: true })
  headName!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
