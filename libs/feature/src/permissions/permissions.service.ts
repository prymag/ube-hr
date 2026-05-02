import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService, Role, CacheService } from '@ube-hr/backend';
import { Permission, ALL_PERMISSIONS } from '@ube-hr/shared';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly CACHE_KEY_PREFIX = 'perms:';
  private readonly TTL = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  /** Reload the cache from the database. */
  async reload() {
    const rows = await this.prisma.rolePermission.findMany();
    const map = new Map<Role, Set<string>>();
    for (const row of rows) {
      if (!map.has(row.role)) map.set(row.role, new Set());
      map.get(row.role)!.add(row.permission);
    }

    // Clear old caches and set new ones
    await this.cacheService.reset();
    for (const [role, perms] of map) {
      await this.cacheService.set(
        `${this.CACHE_KEY_PREFIX}${role}`,
        Array.from(perms),
        this.TTL,
      );
    }
    // Also cache the full map for getAll()
    const allPerms: Record<string, string[]> = {};
    for (const [role, perms] of map) {
      allPerms[role] = Array.from(perms).sort();
    }
    await this.cacheService.set(
      `${this.CACHE_KEY_PREFIX}all`,
      allPerms,
      this.TTL,
    );
  }

  async hasPermission(role: Role, permission: string): Promise<boolean> {
    const perms = await this.cacheService.get<string[]>(
      `${this.CACHE_KEY_PREFIX}${role}`,
    );
    if (perms) {
      return perms.includes(permission);
    }

    // Fallback to DB if cache miss (though reload() should populate it)
    const row = await this.prisma.rolePermission.findFirst({
      where: { role, permission },
    });
    return !!row;
  }

  async hasPermissions(role: Role, permissions: string[]): Promise<boolean> {
    const perms = await this.cacheService.get<string[]>(
      `${this.CACHE_KEY_PREFIX}${role}`,
    );
    if (perms) {
      return permissions.every((p) => perms.includes(p));
    }

    // Fallback to DB
    for (const p of permissions) {
      const row = await this.prisma.rolePermission.findFirst({
        where: { role, permission: p },
      });
      if (!row) return false;
    }
    return true;
  }

  /** Returns permissions for all roles as a plain object. */
  async getAll(): Promise<Record<string, string[]>> {
    const cached = await this.cacheService.get<Record<string, string[]>>(
      `${this.CACHE_KEY_PREFIX}all`,
    );
    if (cached) return cached;

    const rows = await this.prisma.rolePermission.findMany();
    const result: Record<string, string[]> = {};
    for (const row of rows) {
      if (!result[row.role]) result[row.role] = [];
      result[row.role].push(row.permission);
    }
    for (const role in result) {
      result[role].sort();
    }
    await this.cacheService.set(
      `${this.CACHE_KEY_PREFIX}all`,
      result,
      this.TTL,
    );
    return result;
  }

  /** Returns permissions for a single role. */
  async getForRole(role: Role): Promise<string[]> {
    const cached = await this.cacheService.get<string[]>(
      `${this.CACHE_KEY_PREFIX}${role}`,
    );
    if (cached) return cached;

    const rows = await this.prisma.rolePermission.findMany({
      where: { role },
    });
    const perms = rows.map((r) => r.permission).sort();
    await this.cacheService.set(
      `${this.CACHE_KEY_PREFIX}${role}`,
      perms,
      this.TTL,
    );
    return perms;
  }

  async grant(role: Role, permission: Permission): Promise<void> {
    if (!ALL_PERMISSIONS.includes(permission)) {
      throw new NotFoundException(`Unknown permission: ${permission}`);
    }
    if (await this.hasPermission(role, permission)) {
      throw new ConflictException(
        `Role ${role} already has permission ${permission}`,
      );
    }
    await this.prisma.rolePermission.create({ data: { role, permission } });
    await this.reload();
  }

  async revoke(role: Role, permission: Permission): Promise<void> {
    if (!(await this.hasPermission(role, permission))) {
      throw new NotFoundException(
        `Role ${role} does not have permission ${permission}`,
      );
    }
    await this.prisma.rolePermission.delete({
      where: { role_permission: { role, permission } },
    });
    await this.reload();
  }
}
