import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VerificationType } from '@ube-hr/feature';

export class RequestVerificationCodeDto {
  @ApiProperty({ enum: VerificationType })
  @IsEnum(VerificationType)
  type!: VerificationType;
}
