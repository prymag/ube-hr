import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import { roleRank, visibleRoles } from '../auth/permissions';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Teams CRUD ---

  async create(dto: CreateTeamDto, ownerId: number) {
    return this.prisma.team.create({ data: { ...dto, ownerId } });
  }

  async findAll() {
    return this.prisma.team.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
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
