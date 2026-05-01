import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import { TeamsService } from './teams.service';
import { createPrismaMock, PrismaMock } from '../testing/prisma.mock';

const makeTeam = (overrides = {}) => ({
  id: 1,
  name: 'Alpha',
  description: null,
  ownerId: 10,
  deletedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a team with the given ownerId', async () => {
      const team = makeTeam();
      prisma.team.create.mockResolvedValue(team);

      const result = await service.create({ name: 'Alpha' }, 10);

      expect(prisma.team.create).toHaveBeenCalledWith({
        data: { name: 'Alpha', ownerId: 10, memberships: { create: { userId: 10 } } },
      });
      expect(result).toEqual(team);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    beforeEach(() => {
      prisma.team.count.mockResolvedValue(2);
      prisma.team.findMany.mockResolvedValue([makeTeam(), makeTeam({ id: 2 })]);
    });

    it('returns a paginated envelope', async () => {
      const result = await service.findAll();
      expect(result).toMatchObject({ total: 2, page: 1, data: expect.any(Array) });
    });

    it('applies search as an OR condition', async () => {
      await service.findAll({ search: 'eng' });

      const whereArg = prisma.team.findMany.mock.calls[0][0].where;
      expect(whereArg).toHaveProperty('OR');
    });

    it('clamps pageSize to 100', async () => {
      await service.findAll({ pageSize: '500' });

      expect(prisma.team.findMany.mock.calls[0][0].take).toBe(100);
    });

    it('defaults to name sort when sortField is invalid', async () => {
      await service.findAll({ sortField: 'bogus' });

      const orderBy = prisma.team.findMany.mock.calls[0][0].orderBy;
      expect(orderBy).toHaveProperty('name');
    });

    it('defaults sort direction to asc', async () => {
      await service.findAll({ sortDir: 'invalid' });

      const orderBy = prisma.team.findMany.mock.calls[0][0].orderBy;
      expect(Object.values(orderBy)[0]).toBe('asc');
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the team when found', async () => {
      const team = makeTeam();
      prisma.team.findUnique.mockResolvedValue(team);

      await expect(service.findById(1)).resolves.toEqual(team);
    });

    it('throws NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('updates and returns the team', async () => {
      const team = makeTeam();
      const updated = makeTeam({ name: 'Beta' });
      prisma.team.findUnique.mockResolvedValue(team);
      prisma.team.update.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Beta' });

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Beta' },
      });
      expect(result).toEqual(updated);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes the team', async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
      prisma.team.update.mockResolvedValue({});

      await service.remove(1);

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ── addMember ─────────────────────────────────────────────────────────────

  describe('addMember', () => {
    beforeEach(() => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.addMember(1, 99, Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when adding SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: Role.SUPER_ADMIN });
      await expect(service.addMember(1, 2, Role.ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user role outranks caller', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: Role.ADMIN });
      await expect(service.addMember(1, 2, Role.MANAGER)).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when user is already a member', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: Role.USER });
      prisma.membership.findUnique.mockResolvedValue({ userId: 2, teamId: 1 });

      await expect(service.addMember(1, 2, Role.ADMIN)).rejects.toThrow(ConflictException);
    });

    it('creates the membership when all checks pass', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: Role.USER });
      prisma.membership.findUnique.mockResolvedValue(null);
      const membership = { userId: 2, teamId: 1, joinedAt: new Date() };
      prisma.membership.create.mockResolvedValue(membership);

      const result = await service.addMember(1, 2, Role.ADMIN);

      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: { userId: 2, teamId: 1 },
      });
      expect(result).toEqual(membership);
    });
  });

  // ── removeMember ──────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('throws NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      await expect(service.removeMember(99, 2)).rejects.toThrow(NotFoundException);
    });

    it('deletes the membership', async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
      prisma.membership.delete.mockResolvedValue({});

      await service.removeMember(1, 2);

      expect(prisma.membership.delete).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 2, teamId: 1 } },
      });
    });
  });
});
