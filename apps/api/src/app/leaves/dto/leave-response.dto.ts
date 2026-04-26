import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaveResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() userId!: number;
  @ApiProperty() leaveType!: string;
  @ApiProperty() status!: string;
  @ApiProperty() startDate!: string;
  @ApiProperty() endDate!: string;
  @ApiProperty() isHalfDay!: boolean;
  @ApiPropertyOptional() halfDayPeriod!: string | null;
  @ApiProperty() durationDays!: number;
  @ApiPropertyOptional() reason!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class LeaveBalanceResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() userId!: number;
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
