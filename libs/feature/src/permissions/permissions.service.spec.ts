import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService, CacheService, Role } from '@ube-hr/backend';
import { PERMISSIONS, Permission } from '@ube-hr/shared';
import { PermissionsService } from './permissions.service';
import { createPrismaMock, PrismaMock } from '../testing/prisma.mock';

const USERS_READ = PERMISSIONS.USERS_READ as Permission;
const USERS_CREATE = PERMISSIONS.USERS_CREATE as Permission;

const createCacheMock = () => {
  const store = new Map<string, any>();
  return {
    store,
    get: jest.fn((key: string) => Promise.resolve(store.get(key))),
    set: jest.fn((key: string, value: any) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    reset: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
};

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaMock;
  let cache: ReturnType<typeof createCacheMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    cache = createCacheMock();

    prisma.rolePermission.findMany.mockResolvedValue([
      { role: Role.ADMIN, permission: USERS_READ },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get(PermissionsService);
    await service.onModuleInit();

    // Seed empty arrays for roles with no permissions so methods always hit
    // cache and never fall through to the DB fallback path.
    for (const role of [Role.USER, Role.MANAGER, Role.SUPER_ADMIN]) {
      cache.store.set(`perms:${role}`, []);
    }
  });

  afterEach(() => jest.clearAllMocks());

  // ── hasPermission ─────────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('returns true for a seeded permission', async () => {
      expect(await service.hasPermission(Role.ADMIN, USERS_READ)).toBe(true);
    });

    it('returns false for a permission not in cache', async () => {
      expect(await service.hasPermission(Role.USER, USERS_READ)).toBe(false);
    });

    it('returns false for a role with no permissions', async () => {
      expect(await service.hasPermission(Role.MANAGER, USERS_READ)).toBe(false);
    });
  });

  // ── hasPermissions ────────────────────────────────────────────────────────

  describe('hasPermissions', () => {
    it('returns true when all permissions are present', async () => {
      expect(await service.hasPermissions(Role.ADMIN, [USERS_READ])).toBe(true);
    });

    it('returns false when any permission is missing', async () => {
      expect(await service.hasPermissions(Role.ADMIN, [USERS_READ, USERS_CREATE])).toBe(false);
    });
  });

  // ── getForRole ────────────────────────────────────────────────────────────

  describe('getForRole', () => {
    it('returns sorted permissions for a role', async () => {
      const perms = await service.getForRole(Role.ADMIN);
      expect(perms).toContain(USERS_READ);
      expect(perms).toEqual([...perms].sort());
    });

    it('returns an empty array for a role with no permissions', async () => {
      expect(await service.getForRole(Role.USER)).toEqual([]);
    });
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns a record keyed by role', async () => {
      const all = await service.getAll();
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
      prisma.rolePermission.findMany.mockResolvedValue([
        { role: Role.ADMIN, permission: USERS_READ },
        { role: Role.USER, permission: USERS_CREATE },
      ]);

      await service.grant(Role.USER, USERS_CREATE);

      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: { role: Role.USER, permission: USERS_CREATE },
      });
      expect(await service.hasPermission(Role.USER, USERS_CREATE)).toBe(true);
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
      prisma.rolePermission.findMany.mockResolvedValue([]);

      await service.revoke(Role.ADMIN, USERS_READ);

      expect(prisma.rolePermission.delete).toHaveBeenCalledWith({
        where: { role_permission: { role: Role.ADMIN, permission: USERS_READ } },
      });
      expect(await service.hasPermission(Role.ADMIN, USERS_READ)).toBe(false);
    });
  });
});
