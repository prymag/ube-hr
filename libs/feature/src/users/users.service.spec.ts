import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as backendSecrets from '@ube-hr/backend';
import { PrismaService, Role, UserStatus } from '@ube-hr/backend';
import { UsersService } from './users.service';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '@ube-hr/backend';
import { createPrismaMock, PrismaMock } from '../testing/prisma.mock';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const queueService: jest.Mocked<Pick<QueueService, 'dispatch'>> = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    const storageService: jest.Mocked<Pick<StorageService, 'upload' | 'delete'>> = {
      upload: jest.fn().mockResolvedValue('path/to/file'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: queueService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('throws ForbiddenException when target role outranks caller', async () => {
      await expect(
        service.create(
          { email: 'a@b.com', password: 'pw', role: Role.ADMIN },
          Role.MANAGER,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com' });

      await expect(
        service.create({ email: 'a@b.com', password: 'pw' }, Role.ADMIN),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and persists the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jest.spyOn(backendSecrets.secrets, 'hash').mockResolvedValue('$argon2$hashed');

      const created = {
        id: 1,
        email: 'a@b.com',
        name: null,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(created);

      const result = await service.create(
        { email: 'a@b.com', password: 'plain' },
        Role.ADMIN,
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'a@b.com',
            password: '$argon2$hashed',
            role: Role.USER,
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('allows creating a user at equal rank to caller', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jest.spyOn(backendSecrets.secrets, 'hash').mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({
        id: 2,
        email: 'mgr@b.com',
        name: null,
        role: Role.MANAGER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });

      await expect(
        service.create(
          { email: 'mgr@b.com', password: 'pw', role: Role.MANAGER },
          Role.MANAGER,
        ),
      ).resolves.not.toThrow();
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    const baseUser = {
      id: 1,
      email: 'a@b.com',
      name: null,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
    };

    beforeEach(() => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([baseUser]);
    });

    it('returns a paginated envelope', async () => {
      const result = await service.findAll(Role.ADMIN);
      expect(result).toMatchObject({ data: [baseUser], total: 1, page: 1 });
    });

    it('restricts visible roles to those at or below caller rank', async () => {
      await service.findAll(Role.MANAGER);

      const whereArg = prisma.user.findMany.mock.calls[0][0].where;
      // MANAGER can see USER and MANAGER only — not ADMIN or SUPER_ADMIN
      expect(whereArg.role).toEqual({ in: expect.not.arrayContaining([Role.ADMIN, Role.SUPER_ADMIN]) });
    });

    it('applies an exact role filter when valid and visible', async () => {
      await service.findAll(Role.ADMIN, { role: 'USER' });

      const whereArg = prisma.user.findMany.mock.calls[0][0].where;
      expect(whereArg.role).toBe(Role.USER);
    });

    it('falls back to visible-roles filter when requested role is not visible', async () => {
      // MANAGER requesting ADMIN role — should be ignored
      await service.findAll(Role.MANAGER, { role: 'ADMIN' });

      const whereArg = prisma.user.findMany.mock.calls[0][0].where;
      expect(whereArg.role).toEqual({ in: expect.any(Array) });
    });

    it('applies search as an OR condition', async () => {
      await service.findAll(Role.ADMIN, { search: 'alice' });

      const whereArg = prisma.user.findMany.mock.calls[0][0].where;
      expect(whereArg).toHaveProperty('OR');
    });

    it('clamps pageSize to 100', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);
      await service.findAll(Role.ADMIN, { pageSize: '9999' });

      const takeArg = prisma.user.findMany.mock.calls[0][0].take;
      expect(takeArg).toBe(100);
    });

    it('defaults to createdAt sort when sortField is invalid', async () => {
      await service.findAll(Role.ADMIN, { sortField: 'notafield' });

      const orderBy = prisma.user.findMany.mock.calls[0][0].orderBy;
      expect(orderBy).toHaveProperty('createdAt');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.remove(99, Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when target rank >= caller rank', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, role: Role.ADMIN });
      await expect(service.remove(2, Role.ADMIN)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when user owns teams', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, role: Role.USER });
      prisma.team.count.mockResolvedValue(1);
      await expect(service.remove(2, Role.ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('soft-deletes and anonymises the email', async () => {
      const user = { id: 2, email: 'bob@example.com', role: Role.USER };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.team.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await service.remove(2, Role.ADMIN);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            email: expect.stringMatching(/^deleted\.\d+\.bob@example\.com$/),
          }),
        }),
      );
    });

    it('SUPER_ADMIN can delete any user regardless of rank', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 3, role: Role.ADMIN });
      prisma.team.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await expect(service.remove(3, Role.SUPER_ADMIN)).resolves.not.toThrow();
    });
  });

  // ── findByEmailAndPassword ────────────────────────────────────────────────

  describe('findByEmailAndPassword', () => {
    it('returns null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findByEmailAndPassword('x@y.com', 'pw')).resolves.toBeNull();
    });

    it('returns null when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hash', status: UserStatus.ACTIVE });
      jest.spyOn(backendSecrets.secrets, 'verify').mockResolvedValue(false);

      await expect(service.findByEmailAndPassword('x@y.com', 'wrong')).resolves.toBeNull();
    });

    it('returns null when user is BLOCKED', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hash', status: UserStatus.BLOCKED });
      jest.spyOn(backendSecrets.secrets, 'verify').mockResolvedValue(true);

      await expect(service.findByEmailAndPassword('x@y.com', 'pw')).resolves.toBeNull();
    });

    it('returns the user record on valid credentials', async () => {
      const user = { id: 1, email: 'x@y.com', password: 'hash', status: UserStatus.ACTIVE };
      prisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(backendSecrets.secrets, 'verify').mockResolvedValue(true);

      await expect(service.findByEmailAndPassword('x@y.com', 'pw')).resolves.toEqual(user);
    });
  });

  // ── incrementTokenVersion ─────────────────────────────────────────────────

  describe('incrementTokenVersion', () => {
    it('increments and returns the new version', async () => {
      prisma.user.update.mockResolvedValue({ refreshTokenVersion: 3 });

      const version = await service.incrementTokenVersion(1);

      expect(version).toBe(3);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshTokenVersion: { increment: 1 } },
      });
    });
  });
});
