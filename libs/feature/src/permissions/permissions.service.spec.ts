import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import { PERMISSIONS, Permission } from '@ube-hr/shared';
import { PermissionsService } from './permissions.service';
import { createPrismaMock, PrismaMock } from '../testing/prisma.mock';

const USERS_READ = PERMISSIONS.USERS_READ as Permission;
const USERS_CREATE = PERMISSIONS.USERS_CREATE as Permission;

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    // Seed the cache with a default row so onModuleInit works without error
    prisma.rolePermission.findMany.mockResolvedValue([
      { role: Role.ADMIN, permission: USERS_READ },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    // Manually trigger lifecycle hook (TestingModule does not call it automatically)
    service = module.get(PermissionsService);
    await service.onModuleInit();
  });

  afterEach(() => jest.clearAllMocks());

  // ── hasPermission ─────────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('returns true for a seeded permission', () => {
      expect(service.hasPermission(Role.ADMIN, USERS_READ)).toBe(true);
    });

    it('returns false for a permission not in cache', () => {
      expect(service.hasPermission(Role.USER, USERS_READ)).toBe(false);
    });

    it('returns false for a role with no permissions', () => {
      expect(service.hasPermission(Role.MANAGER, USERS_READ)).toBe(false);
    });
  });

  // ── hasPermissions ────────────────────────────────────────────────────────

  describe('hasPermissions', () => {
    it('returns true when all permissions are present', () => {
      expect(service.hasPermissions(Role.ADMIN, [USERS_READ])).toBe(true);
    });

    it('returns false when any permission is missing', () => {
      expect(service.hasPermissions(Role.ADMIN, [USERS_READ, USERS_CREATE])).toBe(false);
    });
  });

  // ── getForRole ────────────────────────────────────────────────────────────

  describe('getForRole', () => {
    it('returns sorted permissions for a role', () => {
      const perms = service.getForRole(Role.ADMIN);
      expect(perms).toContain(USERS_READ);
      expect(perms).toEqual([...perms].sort());
    });

    it('returns an empty array for a role with no permissions', () => {
      expect(service.getForRole(Role.USER)).toEqual([]);
    });
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns a record keyed by role', () => {
      const all = service.getAll();
      expect(all).toHaveProperty(Role.ADMIN);
      expect(all[Role.ADMIN]).toContain(USERS_READ);
    });
  });

  // ── grant ─────────────────────────────────────────────────────────────────

  describe('grant', () => {
    it('throws NotFoundException for an unknown permission', async () => {
      await expect(
        service.grant(Role.USER, 'not:real' as Permission),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when role already has the permission', async () => {
      await expect(
        service.grant(Role.ADMIN, USERS_READ),
      ).rejects.toThrow(ConflictException);
    });

    it('persists and reloads the cache on success', async () => {
      prisma.rolePermission.create.mockResolvedValue({});
      // Simulate reload returning the new state
      prisma.rolePermission.findMany.mockResolvedValue([
        { role: Role.ADMIN, permission: USERS_READ },
        { role: Role.USER, permission: USERS_CREATE },
      ]);

      await service.grant(Role.USER, USERS_CREATE);

      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: { role: Role.USER, permission: USERS_CREATE },
      });
      expect(service.hasPermission(Role.USER, USERS_CREATE)).toBe(true);
    });
  });

  // ── revoke ────────────────────────────────────────────────────────────────

  describe('revoke', () => {
    it('throws NotFoundException when role does not have the permission', async () => {
      await expect(
        service.revoke(Role.USER, USERS_READ),
      ).rejects.toThrow(NotFoundException);
    });

    it('removes the permission and reloads the cache on success', async () => {
      prisma.rolePermission.delete.mockResolvedValue({});
      // Simulate reload returning the state after revocation
      prisma.rolePermission.findMany.mockResolvedValue([]);

      await service.revoke(Role.ADMIN, USERS_READ);

      expect(prisma.rolePermission.delete).toHaveBeenCalledWith({
        where: { role_permission: { role: Role.ADMIN, permission: USERS_READ } },
      });
      expect(service.hasPermission(Role.ADMIN, USERS_READ)).toBe(false);
    });
  });
});
