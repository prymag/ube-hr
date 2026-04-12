import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import { Permission, ALL_PERMISSIONS } from '@ube-hr/shared';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private cache = new Map<Role, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.reload();
  }

  /** Reload the in-memory cache from the database. */
  async reload() {
    const rows = await this.prisma.rolePermission.findMany();
    const map = new Map<Role, Set<string>>();
    for (const row of rows) {
      if (!map.has(row.role)) map.set(row.role, new Set());
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      map.get(row.role)!.add(row.permission);
    }
    this.cache = map;
  }

  hasPermission(role: Role, permission: string): boolean {
    return this.cache.get(role)?.has(permission) ?? false;
  }

  hasPermissions(role: Role, permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(role, p));
  }

  /** Returns permissions for all roles as a plain object. */
  getAll(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [role, perms] of this.cache) {
      result[role] = Array.from(perms).sort();
    }
    return result;
  }

  /** Returns permissions for a single role. */
  getForRole(role: Role): string[] {
    return Array.from(this.cache.get(role) ?? []).sort();
  }

  async grant(role: Role, permission: Permission): Promise<void> {
    if (!ALL_PERMISSIONS.includes(permission)) {
      throw new NotFoundException(`Unknown permission: ${permission}`);
    }
    if (this.hasPermission(role, permission)) {
      throw new ConflictException(
        `Role ${role} already has permission ${permission}`,
      );
    }
    await this.prisma.rolePermission.create({ data: { role, permission } });
    await this.reload();
  }

  async revoke(role: Role, permission: Permission): Promise<void> {
    if (!this.hasPermission(role, permission)) {
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
