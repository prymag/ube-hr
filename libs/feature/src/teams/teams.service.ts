import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import { roleRank, visibleRoles } from '../auth/permissions';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

const VALID_TEAM_SORT = ['name', 'createdAt'] as const;
type TeamSortField = typeof VALID_TEAM_SORT[number];

export interface TeamsQuery {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Teams CRUD ---

  async create(dto: CreateTeamDto, ownerId: number) {
    return this.prisma.team.create({ data: { ...dto, ownerId } });
  }

  async findAll(query: TeamsQuery = {}) {
    const { search, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10));

    const validSort: TeamSortField = (VALID_TEAM_SORT as readonly string[]).includes(sortField ?? '')
      ? (sortField as TeamSortField)
      : 'name';
    const validDir = sortDir === 'desc' ? 'desc' : ('asc' as const);

    const where = {
      deletedAt: null as null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.team.count({ where }),
      this.prisma.team.findMany({
        where,
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

  async findById(id: number) {
    const team = await this.prisma.team.findUnique({ where: { id, deletedAt: null } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(id: number, dto: UpdateTeamDto) {
    await this.findById(id);
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Membership ---

  async getMembers(teamId: number, callerRole: Role) {
    await this.findById(teamId);
    const memberships = await this.prisma.membership.findMany({
      where: { teamId, user: { role: { in: visibleRoles(callerRole) } } },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.user, joinedAt: m.joinedAt }));
  }

  async addMember(teamId: number, userId: number, callerRole: Role) {
    await this.findById(teamId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new BadRequestException('Super admins cannot be assigned to teams');
    if (roleRank(user.role) > roleRank(callerRole)) throw new ForbiddenException('Cannot assign a user with a higher role');
    const existing = await this.prisma.membership.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (existing) throw new ConflictException('User is already a member of this team');
    return this.prisma.membership.create({ data: { userId, teamId } });
  }

  async removeMember(teamId: number, userId: number) {
    await this.findById(teamId);
    await this.prisma.membership.delete({
      where: { userId_teamId: { userId, teamId } },
    });
  }
}
