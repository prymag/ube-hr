import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  secrets,
  PrismaService,
  Role,
  UserStatus,
  type UserModel,
} from '@ube-hr/backend';
import { type PaginatedResponse, JOB_QUEUES, EMAIL_JOBS, type WelcomeEmailPayload } from '@ube-hr/shared';

import { roleRank, visibleRoles } from '../permissions';
import { QueueService } from '../queue/queue.service';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

export interface UserRecord {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

export type PaginatedUsers = PaginatedResponse<UserRecord>;

const VALID_USER_SORT = [
  'name',
  'email',
  'role',
  'status',
  'createdAt',
] as const;
type UserSortField = (typeof VALID_USER_SORT)[number];

export interface UsersQuery {
  search?: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async findAll(
    callerRole: Role,
    query: UsersQuery = {},
  ): Promise<PaginatedUsers> {
    const { search, role, status, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: UserSortField = (
      VALID_USER_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as UserSortField)
      : 'createdAt';
    const validDir = sortDir === 'asc' ? 'asc' : ('desc' as const);

    const visible = visibleRoles(callerRole);
    const validRole =
      role && Object.values(Role).includes(role as Role)
        ? (role as Role)
        : undefined;
    const validStatus =
      status && Object.values(UserStatus).includes(status as UserStatus)
        ? (status as UserStatus)
        : undefined;

    const roleFilter =
      validRole && visible.includes(validRole) ? validRole : { in: visible };

    const where = {
      deletedAt: null as null,
      role: roleFilter,
      ...(validStatus ? { status: validStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { [validSort]: validDir },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      pageCount: Math.max(1, Math.ceil(total / pageSizeNum)),
    };
  }

  async create(dto: CreateUserInput, callerRole: Role): Promise<UserRecord> {
    const targetRole = dto.role ?? Role.USER;
    if (roleRank(targetRole) > roleRank(callerRole)) {
      throw new ForbiddenException('Cannot create a user with a higher role');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email is already in use');
    const password = await secrets.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password, name: dto.name, role: targetRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    await this.queue.dispatch<WelcomeEmailPayload>(JOB_QUEUES.EMAIL, EMAIL_JOBS.SEND_WELCOME, {
      to: user.email,
      name: user.name ?? user.email,
    });
    return user;
  }

  async findByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<UserModel | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
    if (!user) return null;

    const valid = await secrets.verify(user.password, password);
    if (!valid) return null;

    if (user.status === UserStatus.BLOCKED) return null;

    return user;
  }

  async findById(id: number): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async findTeams(
    userId: number,
  ): Promise<
    { id: number; name: string; description: string | null; joinedAt: Date }[]
  > {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        team: { select: { id: true, name: true, description: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.team, joinedAt: m.joinedAt }));
  }

  async remove(id: number, callerRole: Role): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (
      callerRole !== Role.SUPER_ADMIN &&
      roleRank(user.role) >= roleRank(callerRole)
    ) {
      throw new ForbiddenException(
        'Cannot delete a user with an equal or higher role',
      );
    }
    const ownedTeams = await this.prisma.team.count({
      where: { ownerId: id, deletedAt: null },
    });
    if (ownedTeams > 0)
      throw new BadRequestException(
        'User owns one or more teams and cannot be deleted',
      );
    const timestamp = Date.now();
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        email: `deleted.${timestamp}.${user.email}`,
      },
    });
  }

  async incrementTokenVersion(id: number): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { refreshTokenVersion: { increment: 1 } },
    });
    return user.refreshTokenVersion;
  }
}
