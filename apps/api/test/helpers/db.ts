import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@ube-hr/backend';
import { PermissionsService } from '@ube-hr/feature';
import { DEFAULT_ROLE_PERMISSIONS } from '@ube-hr/shared';

/**
 * Truncate all tables in dependency order (respects foreign keys) and reload
 * the permissions cache so subsequent requests don't see stale state.
 * Call in afterEach to keep tests isolated.
 */
export async function truncateAll(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.membership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.leaveApprovalStep.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalanceAudit.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveAccrualConfig.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.user.deleteMany();
  await app.get(PermissionsService).reload();
}

/**
 * Insert DEFAULT_ROLE_PERMISSIONS into the database and reload the cache.
 * Call in beforeEach after truncateAll so every test starts with the
 * standard permission set.
 */
export async function seedDefaultPermissions(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const rows = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([role, perms]) =>
    perms.map((permission) => ({ role, permission })),
  );
  await prisma.rolePermission.createMany({ data: rows as any });
  await app.get(PermissionsService).reload();
}
