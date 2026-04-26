import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  LeavesService,
  PermissionsService,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  type LeaveWithUserRecord,
  type LeaveWithStepsRecord,
  type LeaveApprovalStepRecord,
} from '@ube-hr/feature';
import { LeaveType, type LeaveBalanceModel } from '@ube-hr/backend';
import {
  PERMISSIONS,
  type LeaveRequestResponse,
  type LeaveRequestDetailResponse,
  type LeaveApprovalStepResponse,
  type LeaveBalanceResponse,
  type PaginatedResponse,
} from '@ube-hr/shared';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import {
  LeaveResponseDto,
  LeaveBalanceResponseDto,
} from './dto/leave-response.dto';

function toLeaveResponse(r: LeaveWithUserRecord): LeaveRequestResponse {
  return {
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    leaveType: r.leaveType as LeaveRequestResponse['leaveType'],
    status: r.status as LeaveRequestResponse['status'],
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    isHalfDay: r.isHalfDay,
    halfDayPeriod: r.halfDayPeriod as LeaveRequestResponse['halfDayPeriod'],
    durationDays: r.durationDays,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toStepResponse(s: LeaveApprovalStepRecord): LeaveApprovalStepResponse {
  return {
    id: s.id,
    leaveRequestId: s.leaveRequestId,
    approverId: s.approverId,
    approverName: s.approverName,
    approverEmail: s.approverEmail,
    stage: s.stage,
    status: s.status as LeaveApprovalStepResponse['status'],
    comment: s.comment,
    decidedAt: s.decidedAt ? s.decidedAt.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
  };
}

function toDetailResponse(r: LeaveWithStepsRecord): LeaveRequestDetailResponse {
  return {
    ...toLeaveResponse(r),
    approvalSteps: r.approvalSteps.map(toStepResponse),
  };
}

function toBalanceResponse(b: LeaveBalanceModel): LeaveBalanceResponse {
  return {
    id: b.id,
    userId: b.userId,
    leaveType: b.leaveType as LeaveBalanceResponse['leaveType'],
    year: b.year,
    allocated: b.allocated,
    used: b.used,
    pending: b.pending,
    debt: b.debt,
    lastAccruedAt: b.lastAccruedAt ? b.lastAccruedAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

@ApiTags('leaves')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('leaves')
export class LeavesController {
  constructor(
    private readonly leavesService: LeavesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.LEAVES_CREATE)
  @ApiOperation({ summary: 'File a leave request' })
  @ApiCreatedResponse({ type: LeaveResponseDto })
  async create(
    @Body() dto: CreateLeaveDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveRequestResponse> {
    const leave = await this.leavesService.create({
      userId: req.user!.id,
      userRole: req.user!.role,
      leaveType: dto.type as LeaveType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      isHalfDay: dto.isHalfDay ?? false,
      halfDay: dto.halfDay ?? null,
      reason: dto.reason,
    });
    return toLeaveResponse(leave);
  }

  @Get()
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({
    summary:
      'List own leave requests. Callers with leaves:approve also receive requests pending their action.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'leaveType', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findMy(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('leaveType') leaveType?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<LeaveRequestResponse>> {
    const role = req.user!.role;
    const readAll = this.permissionsService.hasPermission(
      role,
      PERMISSIONS.LEAVES_READ_ALL,
    );
    const canApprove = this.permissionsService.hasPermission(
      role,
      PERMISSIONS.LEAVES_APPROVE,
    );
    const result = await this.leavesService.findMy(
      req.user!.id,
      { status, leaveType, sortField, sortDir, page, pageSize },
      !readAll && canApprove ? req.user!.id : undefined,
      readAll,
    );
    return { ...result, data: result.data.map(toLeaveResponse) };
  }

  @Get('approvals')
  @RequirePermission(PERMISSIONS.LEAVES_APPROVE)
  @ApiOperation({ summary: 'List leave requests pending my approval' })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findForApproval(
    @Req() req: AuthenticatedRequest,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<LeaveRequestResponse>> {
    const result = await this.leavesService.findForApproval(req.user!.id, {
      sortField,
      sortDir,
      page,
      pageSize,
    });
    return { ...result, data: result.data.map(toLeaveResponse) };
  }

  @Get('balances')
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({ summary: 'Get own leave balances for the current year' })
  @ApiOkResponse({ type: [LeaveBalanceResponseDto] })
  async getMyBalances(
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveBalanceResponse[]> {
    const balances = await this.leavesService.getMyBalances(req.user!.id);
    return balances.map(toBalanceResponse);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({
    summary:
      'Get leave request detail. Accessible by the filer or anyone with a step on the request.',
  })
  @ApiOkResponse({ type: LeaveResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveRequestDetailResponse> {
    const leave = await this.leavesService.findById(id);

    const callerId = req.user!.id;
    const isOwner = leave.userId === callerId;
    const hasStep = leave.approvalSteps.some((s) => s.approverId === callerId);

    if (!isOwner && !hasStep) {
      throw new ForbiddenException(
        'You are not authorised to view this leave request',
      );
    }

    return toDetailResponse(leave);
  }

  @Patch(':id/approve')
  @RequirePermission(PERMISSIONS.LEAVES_APPROVE)
  @ApiOperation({ summary: 'Approve a leave request (manager or admin stage). Set override=true to approve even if balance is insufficient (admin only).' })
  @ApiOkResponse({ type: LeaveResponseDto })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveLeaveDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveRequestResponse> {
    const leave = await this.leavesService.approve(
      id,
      req.user!.id,
      req.user!.role,
      dto.override ?? false,
    );
    return toLeaveResponse(leave);
  }

  @Patch(':id/cancel')
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({ summary: 'Cancel own pending leave request' })
  @ApiOkResponse({ type: LeaveResponseDto })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveRequestResponse> {
    const leave = await this.leavesService.cancel(id, req.user!.id);
    return toLeaveResponse(leave);
  }

  @Patch(':id/reject')
  @RequirePermission(PERMISSIONS.LEAVES_APPROVE)
  @ApiOperation({ summary: 'Reject a leave request (manager or admin stage)' })
  @ApiOkResponse({ type: LeaveResponseDto })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectLeaveDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveRequestResponse> {
    const leave = await this.leavesService.reject(
      id,
      req.user!.id,
      req.user!.role,
      dto.comment,
    );
    return toLeaveResponse(leave);
  }
}
