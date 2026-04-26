import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaveBalanceDto {
  @ApiProperty() id!: number;
  @ApiProperty() userId!: number;
  @ApiPropertyOptional() userName?: string | null;
  @ApiPropertyOptional() userEmail?: string;
  @ApiProperty() leaveType!: string;
  @ApiProperty() year!: number;
  @ApiProperty() allocated!: number;
  @ApiProperty() used!: number;
  @ApiProperty() pending!: number;
  @ApiProperty() debt!: number;
  @ApiPropertyOptional() lastAccruedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class LeaveBalanceAuditDto {
  @ApiProperty() id!: number;
  @ApiProperty() userId!: number;
  @ApiProperty() leaveType!: string;
  @ApiProperty() eventType!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() debtDelta!: number;
  @ApiPropertyOptional() note!: string | null;
  @ApiProperty() createdAt!: string;
}

export class AccrualConfigDto {
  @ApiProperty() id!: number;
  @ApiProperty() leaveType!: string;
  @ApiProperty() monthlyRate!: number;
  @ApiProperty() daysPerYear!: number;
  @ApiProperty() carryOverLimit!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
