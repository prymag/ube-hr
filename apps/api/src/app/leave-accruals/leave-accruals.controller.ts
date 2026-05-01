import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import {
  LeaveAccrualService,
  PermissionGuard,
  RequirePermission,
  type AccrualRunResult,
} from '@ube-hr/feature';
import { PERMISSIONS } from '@ube-hr/shared';
import { RunAccrualDto } from './dto/run-accrual.dto';

@ApiTags('leave-accruals')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('leave-accruals')
export class LeaveAccrualsController {
  constructor(private readonly leaveAccrualService: LeaveAccrualService) {}

  @Post('run')
  @RequirePermission(PERMISSIONS.LEAVE_ACCRUAL_RUN)
  @ApiOperation({ summary: 'Trigger a monthly leave accrual run' })
  @ApiCreatedResponse({ description: 'Accrual run triggered', schema: { example: { runId: 'uuid', jobsEnqueued: 10 } } })
  async run(@Body() dto?: RunAccrualDto): Promise<AccrualRunResult> {
    return this.leaveAccrualService.triggerAccrualRun(dto?.year, dto?.month);
  }
}
