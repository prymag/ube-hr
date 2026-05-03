import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaService,
  Role,
  LeaveType,
  LeaveStatus,
  HalfDayPeriod,
  ApprovalStage,
  type LeaveRequestModel,
  type LeaveBalanceModel,
} from '@ube-hr/backend';
import type { PaginatedResponse } from '@ube-hr/shared';
import {
  JOB_QUEUES,
  EMAIL_JOBS,
  type LeaveApproverNotifyPayload,
  type LeaveFilerUpdatePayload,
} from '@ube-hr/shared';
import { HolidaysService } from '../holidays/holidays.service';
import { LeaveBalanceService } from '../leave-balance/leave-balance.service';
import { QueueService } from '../queue/queue.service';

export interface CreateLeaveInput {
  userId: number;
  userRole: Role;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDay: 'AM' | 'PM' | null;
  reason?: string;
}

export interface LeavesQuery {
  status?: string;
  leaveType?: string;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

export interface LeaveApprovalStepRecord {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approverName: string | null;
  approverEmail: string;
  stage: ApprovalStage;
  status: LeaveStatus;
  comment: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

export interface LeaveWithUserRecord extends Omit<LeaveRequestModel, never> {
  userName: string | null;
  userEmail: string;
}

export interface LeaveWithStepsRecord extends LeaveWithUserRecord {
  approvalSteps: LeaveApprovalStepRecord[];
}

export type LeaveRecord = LeaveRequestModel;
export type PaginatedLeaves = PaginatedResponse<LeaveWithUserRecord>;

const VALID_LEAVE_SORT = ['createdAt', 'startDate', 'status'] as const;
type LeaveSortField = (typeof VALID_LEAVE_SORT)[number];

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidaysService: HolidaysService,
    private readonly leaveBalanceService: LeaveBalanceService,
    private readonly queue: QueueService,
  ) {}

  async create(input: CreateLeaveInput): Promise<LeaveWithUserRecord> {
    if (input.isHalfDay) {
      const start = input.startDate.toDateString();
      const end = input.endDate.toDateString();
      if (start !== end) {
        throw new BadRequestException(
          'Half-day leave must be a single day (startDate must equal endDate)',
        );
      }
    }

    const durationDays = await this.holidaysService.countWorkingDays(
      input.startDate,
      input.endDate,
      input.isHalfDay ? (input.halfDay ?? null) : null,
    );

    if (durationDays <= 0) {
      throw new BadRequestException(
        'Leave must cover at least one working day',
      );
    }

    if (input.leaveType !== LeaveType.UNPAID) {
      const year = input.startDate.getFullYear();
      const balance = await this.prisma.leaveBalance.findUnique({
        where: {
          userId_leaveType_year: {
            userId: input.userId,
            leaveType: input.leaveType,
            year,
          },
        },
      });
      const available = balance
        ? balance.allocated - balance.used - balance.pending
        : 0;
      if (available < durationDays) {
        throw new BadRequestException(
          `Insufficient leave balance. Available: ${available}, required: ${durationDays}`,
        );
      }
    }

    const { status, approverIds, stage } = await this.buildApprovalChain(
      input.userId,
      input.userRole,
    );

    const halfDayPeriod =
      input.isHalfDay && input.halfDay
        ? (input.halfDay as HalfDayPeriod)
        : null;

    const year = input.startDate.getFullYear();

    const created = await this.prisma.leaveRequest.create({
      data: {
        userId: input.userId,
        leaveType: input.leaveType,
        status,
        startDate: input.startDate,
        endDate: input.endDate,
        isHalfDay: input.isHalfDay,
        halfDayPeriod,
        durationDays,
        reason: input.reason,
        approvalSteps: {
          create: approverIds.map((approverId) => ({
            approverId,
            stage,
            status: LeaveStatus.PENDING,
          })),
        },
      },
      include: { user: { select: { name: true, email: true } } },
    });

    await this.leaveBalanceService.addPending(
      input.userId,
      input.leaveType,
      year,
      durationDays,
    );

    const result = this.flattenUser(created);

    // Notify initial approvers (fire-and-forget)
    const approvers = await this.prisma.leaveApprovalStep.findMany({
      where: { leaveRequestId: created.id, status: LeaveStatus.PENDING },
      include: { approver: { select: { name: true, email: true } } },
    });
    for (const step of approvers) {
      void this.queue.dispatch<LeaveApproverNotifyPayload>(
        JOB_QUEUES.EMAIL,
        EMAIL_JOBS.LEAVE_APPROVER_NOTIFY,
        {
          to: step.approver.email,
          approverName: step.approver.name,
          filerName: result.userName,
          leaveType: result.leaveType,
          startDate: result.startDate.toISOString().slice(0, 10),
          endDate: result.endDate.toISOString().slice(0, 10),
          durationDays: result.durationDays,
          status: result.status,
        },
      );
    }

    return result;
  }

  async findMy(
    userId: number,
    query: LeavesQuery = {},
    includeApprovalFor?: number,
    readAll?: boolean,
  ): Promise<PaginatedLeaves> {
    const { status, leaveType, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: LeaveSortField = (
      VALID_LEAVE_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as LeaveSortField)
      : 'createdAt';
    const validDir = sortDir === 'asc' ? 'asc' : ('desc' as const);

    const validStatuses = Object.values(LeaveStatus) as string[];
    const validLeaveTypes = Object.values(LeaveType) as string[];

    const statusFilter =
      status && validStatuses.includes(status)
        ? { status: status as LeaveStatus }
        : {};
    const leaveTypeFilter =
      leaveType && validLeaveTypes.includes(leaveType)
        ? { leaveType: leaveType as LeaveType }
        : {};

    const baseFilter = readAll
      ? {}
      : includeApprovalFor !== undefined
        ? {
            OR: [
              { userId },
              {
                status: {
                  in: [LeaveStatus.PENDING_MANAGER, LeaveStatus.PENDING_ADMIN],
                },
                approvalSteps: {
                  some: {
                    approverId: includeApprovalFor,
                    status: LeaveStatus.PENDING,
                  },
                },
              },
            ],
          }
        : { userId };

    const where = {
      deletedAt: null as null,
      ...baseFilter,
      ...statusFilter,
      ...leaveTypeFilter,
    };

    const [total, rows] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { [validSort]: validDir },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      data: rows.map((r) => this.flattenUser(r)),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      pageCount: Math.max(1, Math.ceil(total / pageSizeNum)),
    };
  }

  async findForApproval(
    callerId: number,
    query: LeavesQuery = {},
  ): Promise<PaginatedLeaves> {
    const { sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: LeaveSortField = (
      VALID_LEAVE_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as LeaveSortField)
      : 'createdAt';
    const validDir = sortDir === 'asc' ? 'asc' : ('desc' as const);

    const where = {
      deletedAt: null as null,
      status: {
        in: [
          LeaveStatus.PENDING_MANAGER,
          LeaveStatus.PENDING_ADMIN,
        ] as LeaveStatus[],
      },
      approvalSteps: {
        some: { approverId: callerId, status: LeaveStatus.PENDING },
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { [validSort]: validDir },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      data: rows.map((r) => this.flattenUser(r)),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      pageCount: Math.max(1, Math.ceil(total / pageSizeNum)),
    };
  }

  async findById(leaveId: number): Promise<LeaveWithStepsRecord> {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId, deletedAt: null },
      include: {
        user: { select: { name: true, email: true } },
        approvalSteps: {
          include: {
            approver: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!leave) throw new NotFoundException('Leave request not found');

    const base = this.flattenUser(leave);
    const approvalSteps: LeaveApprovalStepRecord[] = leave.approvalSteps.map(
      (s) => ({
        id: s.id,
        leaveRequestId: s.leaveRequestId,
        approverId: s.approverId,
        approverName: s.approver.name,
        approverEmail: s.approver.email,
        stage: s.stage as ApprovalStage,
        status: s.status,
        comment: s.comment,
        decidedAt: s.decidedAt,
        createdAt: s.createdAt,
      }),
    );

    return { ...base, approvalSteps };
  }

  async approve(
    leaveId: number,
    callerId: number,
    callerRole: Role,
    override = false,
  ): Promise<LeaveWithUserRecord> {
    return this.prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.findUnique({
        where: { id: leaveId, deletedAt: null },
      });
      if (!leave) throw new NotFoundException('Leave request not found');

      const isPendingManager = leave.status === LeaveStatus.PENDING_MANAGER;
      const isPendingAdmin = leave.status === LeaveStatus.PENDING_ADMIN;

      if (!isPendingManager && !isPendingAdmin) {
        throw new BadRequestException('This leave is not awaiting approval');
      }

      const isAdmin =
        callerRole === Role.ADMIN || callerRole === Role.SUPER_ADMIN;

      if (isPendingManager && isAdmin) {
        throw new BadRequestException(
          'This leave is awaiting manager approval first',
        );
      }

      const expectedStage = isPendingManager
        ? ApprovalStage.MANAGER
        : ApprovalStage.ADMIN;

      const step = await tx.leaveApprovalStep.findFirst({
        where: {
          leaveRequestId: leaveId,
          approverId: callerId,
          status: LeaveStatus.PENDING,
          stage: expectedStage,
        },
      });
      if (!step) {
        throw new ForbiddenException(
          'You are not assigned to approve this leave',
        );
      }

      await tx.leaveApprovalStep.update({
        where: { id: step.id },
        data: { status: LeaveStatus.APPROVED, decidedAt: new Date() },
      });

      if (isPendingManager) {
        const adminUsers = await tx.user.findMany({
          where: {
            role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
            deletedAt: null,
          },
          select: { id: true, name: true, email: true },
        });

        const adminIds = adminUsers.map((r) => r.id);

        const updated = await tx.leaveRequest.update({
          where: { id: leaveId },
          data: {
            status: LeaveStatus.PENDING_ADMIN,
            approvalSteps: {
              create: adminIds.map((approverId) => ({
                approverId,
                stage: ApprovalStage.ADMIN,
                status: LeaveStatus.PENDING,
              })),
            },
          },
          include: { user: { select: { name: true, email: true } } },
        });

        const result = this.flattenUser(updated);

        // Notify each admin approver
        for (const admin of adminUsers) {
          void this.queue.dispatch<LeaveApproverNotifyPayload>(
            JOB_QUEUES.EMAIL,
            EMAIL_JOBS.LEAVE_APPROVER_NOTIFY,
            {
              to: admin.email,
              approverName: admin.name,
              filerName: result.userName,
              leaveType: result.leaveType,
              startDate: result.startDate.toISOString().slice(0, 10),
              endDate: result.endDate.toISOString().slice(0, 10),
              durationDays: result.durationDays,
              status: result.status,
            },
          );
        }

        // Notify filer that leave advanced to next stage
        void this.queue.dispatch<LeaveFilerUpdatePayload>(
          JOB_QUEUES.EMAIL,
          EMAIL_JOBS.LEAVE_FILER_UPDATE,
          {
            to: result.userEmail,
            filerName: result.userName,
            leaveType: result.leaveType,
            startDate: result.startDate.toISOString().slice(0, 10),
            endDate: result.endDate.toISOString().slice(0, 10),
            durationDays: result.durationDays,
            status: result.status,
          },
        );

        return result;
      }

      // PENDING_ADMIN: final approval
      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: { status: LeaveStatus.APPROVED },
        include: { user: { select: { name: true, email: true } } },
      });

      await this.leaveBalanceService.finalizeApproval(
        leave.userId,
        leave.leaveType as LeaveType,
        leave.startDate.getFullYear(),
        leave.durationDays,
        override,
      );

      const result = this.flattenUser(updated);

      // Notify filer of final approval
      void this.queue.dispatch<LeaveFilerUpdatePayload>(
        JOB_QUEUES.EMAIL,
        EMAIL_JOBS.LEAVE_FILER_UPDATE,
        {
          to: result.userEmail,
          filerName: result.userName,
          leaveType: result.leaveType,
          startDate: result.startDate.toISOString().slice(0, 10),
          endDate: result.endDate.toISOString().slice(0, 10),
          durationDays: result.durationDays,
          status: result.status,
        },
      );

      return result;
    });
  }

  async reject(
    leaveId: number,
    callerId: number,
    callerRole: Role,
    comment: string,
  ): Promise<LeaveWithUserRecord> {
    if (!comment || !comment.trim()) {
      throw new BadRequestException(
        'A comment is required when rejecting a leave',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.findUnique({
        where: { id: leaveId, deletedAt: null },
      });
      if (!leave) throw new NotFoundException('Leave request not found');

      const isPendingManager = leave.status === LeaveStatus.PENDING_MANAGER;
      const isPendingAdmin = leave.status === LeaveStatus.PENDING_ADMIN;

      if (!isPendingManager && !isPendingAdmin) {
        throw new BadRequestException('This leave is not awaiting approval');
      }

      const isAdmin =
        callerRole === Role.ADMIN || callerRole === Role.SUPER_ADMIN;

      if (isPendingManager && isAdmin) {
        throw new BadRequestException(
          'This leave is awaiting manager approval first',
        );
      }

      const expectedStage = isPendingManager
        ? ApprovalStage.MANAGER
        : ApprovalStage.ADMIN;

      const step = await tx.leaveApprovalStep.findFirst({
        where: {
          leaveRequestId: leaveId,
          approverId: callerId,
          status: LeaveStatus.PENDING,
          stage: expectedStage,
        },
      });
      if (!step) {
        throw new ForbiddenException(
          'You are not assigned to reject this leave',
        );
      }

      await tx.leaveApprovalStep.update({
        where: { id: step.id },
        data: {
          status: LeaveStatus.REJECTED,
          comment: comment.trim(),
          decidedAt: new Date(),
        },
      });

      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: { status: LeaveStatus.REJECTED },
        include: { user: { select: { name: true, email: true } } },
      });

      await this.leaveBalanceService.removePending(
        leave.userId,
        leave.leaveType as LeaveType,
        leave.startDate.getFullYear(),
        leave.durationDays,
      );

      const result = this.flattenUser(updated);

      // Notify filer of rejection
      void this.queue.dispatch<LeaveFilerUpdatePayload>(
        JOB_QUEUES.EMAIL,
        EMAIL_JOBS.LEAVE_FILER_UPDATE,
        {
          to: result.userEmail,
          filerName: result.userName,
          leaveType: result.leaveType,
          startDate: result.startDate.toISOString().slice(0, 10),
          endDate: result.endDate.toISOString().slice(0, 10),
          durationDays: result.durationDays,
          status: result.status,
          rejectionComment: comment.trim(),
        },
      );

      return result;
    });
  }

  async getMyBalances(userId: number): Promise<LeaveBalanceModel[]> {
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { userId, year },
    });
  }

  async cancel(
    leaveId: number,
    callerId: number,
  ): Promise<LeaveWithUserRecord> {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId, deletedAt: null },
    });
    if (!leave) throw new NotFoundException('Leave request not found');

    if (leave.userId !== callerId) {
      throw new ForbiddenException(
        'You can only cancel your own leave requests',
      );
    }

    const cancellable: LeaveStatus[] = [
      LeaveStatus.PENDING_MANAGER,
      LeaveStatus.PENDING_ADMIN,
    ];
    if (!cancellable.includes(leave.status)) {
      throw new BadRequestException(
        'Only pending leave requests can be cancelled',
      );
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: LeaveStatus.CANCELLED },
      include: { user: { select: { name: true, email: true } } },
    });

    await this.leaveBalanceService.removePending(
      leave.userId,
      leave.leaveType as LeaveType,
      leave.startDate.getFullYear(),
      leave.durationDays,
    );

    return this.flattenUser(updated);
  }

  private flattenUser<
    T extends { user: { name: string | null; email: string } },
  >(
    record: T,
  ): Omit<T, 'user'> & { userName: string | null; userEmail: string } {
    const { user, ...rest } = record;
    return { ...rest, userName: user.name, userEmail: user.email };
  }

  private async buildApprovalChain(
    userId: number,
    userRole: Role,
  ): Promise<{
    status: LeaveStatus;
    approverIds: number[];
    stage: ApprovalStage;
  }> {
    if (userRole === Role.USER) {
      const managerIds = await this.getTeamMemberManagers(userId);
      if (managerIds.length > 0) {
        return {
          status: LeaveStatus.PENDING_MANAGER,
          approverIds: managerIds,
          stage: ApprovalStage.MANAGER,
        };
      }
      const deptHeadId = await this.getDepartmentHead(userId);
      if (deptHeadId !== null) {
        return {
          status: LeaveStatus.PENDING_MANAGER,
          approverIds: [deptHeadId],
          stage: ApprovalStage.MANAGER,
        };
      }
      const adminIds = await this.getAdmins(null);
      return {
        status: LeaveStatus.PENDING_ADMIN,
        approverIds: adminIds,
        stage: ApprovalStage.ADMIN,
      };
    }

    if (userRole === Role.MANAGER) {
      const fellowIds = await this.getFellowManagers(userId);
      if (fellowIds.length > 0) {
        return {
          status: LeaveStatus.PENDING_MANAGER,
          approverIds: fellowIds,
          stage: ApprovalStage.MANAGER,
        };
      }
      const adminIds = await this.getAdmins(null);
      return {
        status: LeaveStatus.PENDING_ADMIN,
        approverIds: adminIds,
        stage: ApprovalStage.ADMIN,
      };
    }

    // ADMIN or SUPER_ADMIN
    const adminIds = await this.getAdmins(userId);
    return {
      status: LeaveStatus.PENDING_ADMIN,
      approverIds: adminIds,
      stage: ApprovalStage.ADMIN,
    };
  }

  private async getTeamMemberManagers(userId: number): Promise<number[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { teamId: true },
    });
    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];

    const managers = await this.prisma.membership.findMany({
      where: {
        teamId: { in: teamIds },
        userId: { not: userId },
        user: { role: Role.MANAGER, deletedAt: null },
      },
      select: { userId: true },
    });
    return [...new Set(managers.map((m) => m.userId))];
  }

  private async getDepartmentHead(userId: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        department: {
          select: {
            head: { select: { id: true, deletedAt: true } },
          },
        },
      },
    });
    const head = user?.department?.head;
    if (!head || head.deletedAt !== null || head.id === userId) return null;
    return head.id;
  }

  private async getFellowManagers(userId: number): Promise<number[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { teamId: true },
    });
    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];

    const fellows = await this.prisma.membership.findMany({
      where: {
        teamId: { in: teamIds },
        userId: { not: userId },
        user: { role: Role.MANAGER, deletedAt: null },
      },
      select: { userId: true },
    });
    return [...new Set(fellows.map((f) => f.userId))];
  }

  private async getAdmins(excludeId: number | null): Promise<number[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
        deletedAt: null,
        ...(excludeId !== null ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}
