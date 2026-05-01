import {
  IsDateString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaveTypeDtoEnum {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  BEREAVEMENT = 'BEREAVEMENT',
  OTHER = 'OTHER',
}

export enum HalfDayPeriodDtoEnum {
  AM = 'AM',
  PM = 'PM',
}

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveTypeDtoEnum })
  @IsEnum(LeaveTypeDtoEnum)
  type!: LeaveTypeDtoEnum;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-05-03' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @ApiPropertyOptional({ enum: HalfDayPeriodDtoEnum })
  @ValidateIf((o) => o.isHalfDay === true)
  @IsEnum(HalfDayPeriodDtoEnum)
  halfDay?: HalfDayPeriodDtoEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
