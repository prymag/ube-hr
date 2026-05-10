import { Injectable } from '@nestjs/common';
import { PrismaService, LeaveStatus } from '@ube-hr/backend';
import type { StatsResponse } from '@ube-hr/shared';

const PENDING_STATUSES = [
  LeaveStatus.PENDING,
  LeaveStatus.PENDING_MANAGER,
  LeaveStatus.PENDING_ADMIN,
];

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<StatsResponse> {
    const [totalUsers, totalTeams, totalDepartments, totalPendingLeaves] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.team.count(),
        this.prisma.department.count({ where: { deletedAt: null } }),
        this.prisma.leaveRequest.count({
          where: { status: { in: PENDING_STATUSES } },
        }),
      ]);

    return { totalUsers, totalTeams, totalDepartments, totalPendingLeaves };
  }
}
