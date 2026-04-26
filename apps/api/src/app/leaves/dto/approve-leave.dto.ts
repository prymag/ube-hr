import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ApproveLeaveDto {
  @ApiPropertyOptional({ description: 'Approve even if balance would go negative, recording deficit as debt' })
  @IsOptional()
  @IsBoolean()
  override?: boolean;
}
