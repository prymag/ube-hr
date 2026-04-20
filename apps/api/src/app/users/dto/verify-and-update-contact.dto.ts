import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { VerificationType } from '@ube-hr/feature';

export class VerifyAndUpdateContactDto {
  @ApiProperty({ enum: VerificationType })
  @IsString()
  @IsNotEmpty()
  type!: VerificationType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  value?: string;
}
