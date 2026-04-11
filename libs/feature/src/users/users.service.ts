import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { secrets, PrismaService, Role, UserStatus } from '@ube-hr/backend';
import { roleRank, visibleRoles } from '../auth/permissions';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(callerRole: Role) {
    return this.prisma.user.findMany({
      where: { deletedAt: null, role: { in: visibleRoles(callerRole) } },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto, callerRole: Role) {
    const targetRole = dto.role ?? Role.USER;
    if (roleRank(targetRole) > roleRank(callerRole)) {
      throw new ForbiddenException('Cannot create a user with a higher role');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email is already in use');
    const password = await secrets.hash(dto.password);
    return this.prisma.user.create({
      data: { email: dto.email, password, name: dto.name, role: targetRole },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
  }

  async findByEmailAndPassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email, deletedAt: null } });
    if (!user) return null;

    const valid = await secrets.verify(user.password, password);
    if (!valid) return null;

    if (user.status === UserStatus.BLOCKED) return null;

    return user;
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async findTeams(userId: number) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { team: { select: { id: true, name: true, description: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.team, joinedAt: m.joinedAt }));
  }

  async remove(id: number, callerRole: Role) {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    if (callerRole !== Role.SUPER_ADMIN && roleRank(user.role) >= roleRank(callerRole)) {
      throw new ForbiddenException('Cannot delete a user with an equal or higher role');
    }
    const ownedTeams = await this.prisma.team.count({ where: { ownerId: id, deletedAt: null } });
    if (ownedTeams > 0) throw new BadRequestException('User owns one or more teams and cannot be deleted');
    const timestamp = Date.now();
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), email: `deleted.${timestamp}.${user.email}` },
    });
  }

  async incrementTokenVersion(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { refreshTokenVersion: { increment: 1 } },
    });
    return user.refreshTokenVersion;
  }
}
