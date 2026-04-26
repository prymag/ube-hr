import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  LeaveBalanceService,
  PermissionsService,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  type LeaveBalanceRecord,
  type LeaveBalanceAuditRecord,
  type LeaveAccrualConfigRecord,
} from '@ube-hr/feature';
import { LeaveType } from '@ube-hr/backend';
import {
  PERMISSIONS,
  type LeaveBalanceResponse,
  type LeaveBalanceWithUser,
  type LeaveBalanceAuditResponse,
  type LeaveAccrualConfigResponse,
  type PaginatedResponse,
} from '@ube-hr/shared';
import { GrantBalanceDto } from './dto/grant-balance.dto';
import { UpdateAccrualConfigDto } from './dto/update-config.dto';
import {
  LeaveBalanceDto,
  LeaveBalanceAuditDto,
  AccrualConfigDto,
} from './dto/leave-balance-response.dto';

function toBalanceResponse(b: LeaveBalanceRecord): LeaveBalanceResponse | LeaveBalanceWithUser {
  return {
    id: b.id,
    userId: b.userId,
    leaveType: b.leaveType as LeaveBalanceResponse['leaveType'],
    year: b.year,
    allocated: b.allocated,
    used: b.used,
    pending: b.pending,
    debt: b.debt,
    lastAccruedAt: b.lastAccruedAt ? (b.lastAccruedAt as Date).toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    ...(b.userName !== undefined ? { userName: b.userName } : {}),
    ...(b.userEmail !== undefined ? { userEmail: b.userEmail } : {}),
  };
}

function toAuditResponse(a: LeaveBalanceAuditRecord): LeaveBalanceAuditResponse {
  return {
    id: a.id,
    userId: a.userId,
    leaveType: a.leaveType as LeaveBalanceAuditResponse['leaveType'],
    eventType: a.eventType,
    amount: a.amount,
    debtDelta: a.debtDelta,
    note: a.note,
    createdAt: a.createdAt.toISOString(),
  };
}

function toConfigResponse(c: LeaveAccrualConfigRecord): LeaveAccrualConfigResponse {
  return {
    id: c.id,
    leaveType: c.leaveType as LeaveAccrualConfigResponse['leaveType'],
    monthlyRate: c.monthlyRate,
    daysPerYear: c.daysPerYear,
    carryOverLimit: c.carryOverLimit,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

@ApiTags('leave-balance')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('leave-balance')
export class LeaveBalanceController {
  constructor(
    private readonly leaveBalanceService: LeaveBalanceService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('config')
  @RequirePermission(PERMISSIONS.LEAVES_BALANCE_MANAGE)
  @ApiOperation({ summary: 'Get all accrual configs' })
  @ApiOkResponse({ type: [AccrualConfigDto] })
  async getConfigs(): Promise<LeaveAccrualConfigResponse[]> {
    const configs = await this.leaveBalanceService.getConfigs();
    return configs.map(toConfigResponse);
  }

  @Put('config/:type')
  @RequirePermission(PERMISSIONS.LEAVES_BALANCE_MANAGE)
  @ApiOperation({ summary: 'Set monthly accrual rate for a leave type' })
  @ApiOkResponse({ type: AccrualConfigDto })
  async updateConfig(
    @Param('type') type: string,
    @Body() dto: UpdateAccrualConfigDto,
  ): Promise<LeaveAccrualConfigResponse> {
    const validTypes = Object.values(LeaveType) as string[];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Invalid leave type: ${type}`);
    }
    const config = await this.leaveBalanceService.upsertConfig(
      type as LeaveType,
      dto.monthlyRate,
    );
    return toConfigResponse(config);
  }

  @Post('accrue')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.LEAVES_BALANCE_MANAGE)
  @ApiOperation({ summary: 'Trigger monthly accrual job manually' })
  async triggerAccrual(): Promise<{ processed: number; skipped: number }> {
    return this.leaveBalanceService.runMonthlyAccrual();
  }

  @Get()
  @RequirePermission(PERMISSIONS.LEAVES_BALANCE_MANAGE)
  @ApiOperation({ summary: 'Admin: list all leave balances' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'leaveType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getAllBalances(
    @Query('userId') userId?: string,
    @Query('leaveType') leaveType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<LeaveBalanceWithUser>> {
    const result = await this.leaveBalanceService.getAllBalances({
      userId,
      leaveType,
      page,
      pageSize,
    });
    return {
      ...result,
      data: result.data.map((b) => toBalanceResponse(b) as LeaveBalanceWithUser),
    };
  }

  @Get(':userId/history')
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({ summary: 'Get balance audit history for a user' })
  @ApiQuery({ name: 'leaveType', required: false })
  @ApiOkResponse({ type: [LeaveBalanceAuditDto] })
  async getHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
    @Query('leaveType') leaveType?: string,
  ): Promise<LeaveBalanceAuditResponse[]> {
    const isOwn = req.user!.id === userId;
    const canManage = this.permissionsService.hasPermission(
      req.user!.role,
      PERMISSIONS.LEAVES_BALANCE_MANAGE,
    );
    if (!isOwn && !canManage) {
      throw new ForbiddenException('You can only view your own balance history');
    }
    const validTypes = Object.values(LeaveType) as string[];
    const type =
      leaveType && validTypes.includes(leaveType)
        ? (leaveType as LeaveType)
        : undefined;
    const audits = await this.leaveBalanceService.getAuditHistory(userId, type);
    return audits.map(toAuditResponse);
  }

  @Get(':userId')
  @RequirePermission(PERMISSIONS.LEAVES_READ)
  @ApiOperation({ summary: "Get a user's leave balances" })
  @ApiOkResponse({ type: [LeaveBalanceDto] })
  async getBalances(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaveBalanceResponse[]> {
    const isOwn = req.user!.id === userId;
    const canManage = this.permissionsService.hasPermission(
      req.user!.role,
      PERMISSIONS.LEAVES_BALANCE_MANAGE,
    );
    if (!isOwn && !canManage) {
      throw new ForbiddenException('You can only view your own leave balances');
    }
    if (!isOwn) {
      await this.leaveBalanceService.findUserOrThrow(userId);
    }
    const balances = await this.leaveBalanceService.getBalancesForUser(userId);
    return balances.map((b) => toBalanceResponse(b) as LeaveBalanceResponse);
  }

  @Post(':userId/grant')
  @RequirePermission(PERMISSIONS.LEAVES_BALANCE_MANAGE)
  @ApiOperation({ summary: 'Admin: manually grant leave balance credits to a user' })
  @ApiCreatedResponse({ description: 'Credits granted' })
  async grantBalance(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: GrantBalanceDto,
  ): Promise<{ ok: boolean }> {
    await this.leaveBalanceService.findUserOrThrow(userId);
    const validTypes = Object.values(LeaveType) as string[];
    if (!validTypes.includes(dto.leaveType)) {
      throw new BadRequestException(`Invalid leave type: ${dto.leaveType}`);
    }
    await this.leaveBalanceService.grantCredit({
      userId,
      leaveType: dto.leaveType as LeaveType,
      amount: dto.amount,
      note: dto.note,
    });
    return { ok: true };
  }
}
