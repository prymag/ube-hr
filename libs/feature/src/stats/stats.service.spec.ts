import { Test } from '@nestjs/testing';
import { PrismaService, LeaveStatus } from '@ube-hr/backend';
import { StatsService } from './stats.service';

const createPrismaMock = () => ({
  user: { count: jest.fn() },
  team: { count: jest.fn() },
  department: { count: jest.fn() },
  leaveRequest: { count: jest.fn() },
});

describe('StatsService', () => {
  let service: StatsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(StatsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns correct counts from prisma', async () => {
    prisma.user.count.mockResolvedValue(10);
    prisma.team.count.mockResolvedValue(3);
    prisma.department.count.mockResolvedValue(5);
    prisma.leaveRequest.count.mockResolvedValue(7);

    const result = await service.getStats();

    expect(result).toEqual({
      totalUsers: 10,
      totalTeams: 3,
      totalDepartments: 5,
      totalPendingLeaves: 7,
    });
  });

  it('counts only non-deleted users', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.team.count.mockResolvedValue(0);
    prisma.department.count.mockResolvedValue(0);
    prisma.leaveRequest.count.mockResolvedValue(0);

    await service.getStats();

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });

  it('counts only non-deleted departments', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.team.count.mockResolvedValue(0);
    prisma.department.count.mockResolvedValue(0);
    prisma.leaveRequest.count.mockResolvedValue(0);

    await service.getStats();

    expect(prisma.department.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });

  it('counts all three pending statuses for leave requests', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.team.count.mockResolvedValue(0);
    prisma.department.count.mockResolvedValue(0);
    prisma.leaveRequest.count.mockResolvedValue(0);

    await service.getStats();

    expect(prisma.leaveRequest.count).toHaveBeenCalledWith({
      where: {
        status: {
          in: [
            LeaveStatus.PENDING,
            LeaveStatus.PENDING_MANAGER,
            LeaveStatus.PENDING_ADMIN,
          ],
        },
      },
    });
  });
});
