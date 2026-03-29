import { UsersRepository } from '../users.repository';
import type { UsersCreateInput, UsersFilters, UsersUpdateInput } from '../users.repository';
import type { PrismaClient } from '@/generated/prisma/client';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

function makePrisma(overrides: Partial<{
  userFindUnique: jest.Mock;
  userFindMany: jest.Mock;
  userCount: jest.Mock;
  userCreate: jest.Mock;
  userUpdate: jest.Mock;
  userDelete: jest.Mock;
}> = {}): jest.Mocked<PrismaClient> {
  return {
    user: {
      findUnique: overrides.userFindUnique ?? jest.fn(),
      findMany: overrides.userFindMany ?? jest.fn().mockResolvedValue([]),
      count: overrides.userCount ?? jest.fn().mockResolvedValue(0),
      create: overrides.userCreate ?? jest.fn(),
      update: overrides.userUpdate ?? jest.fn(),
      delete: overrides.userDelete ?? jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaClient>;
}

const userFixture = {
  id: 'user-1',
  email: 'alice@example.com',
  password: 'hashed',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminFixture = { ...userFixture, id: 'admin-1', role: 'ADMIN' as const };
const sysAdminFixture = { ...userFixture, id: 'sys-1', role: 'SYSTEM_ADMIN' as const };

// ─── findById ─────────────────────────────────────────────────────────────────

describe('UsersRepository.findById', () => {
  it('returns a user when found', async () => {
    const prisma = makePrisma({ userFindUnique: jest.fn().mockResolvedValue(userFixture) });
    const repo = new UsersRepository(prisma);

    const result = await repo.findById('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual(userFixture);
  });

  it('returns null when user is not found', async () => {
    const prisma = makePrisma({ userFindUnique: jest.fn().mockResolvedValue(null) });
    const repo = new UsersRepository(prisma);

    const result = await repo.findById('missing-id');

    expect(result).toBeNull();
  });
});

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('UsersRepository.findAll', () => {
  it('returns paginated users without filters', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([userFixture]),
      userCount: jest.fn().mockResolvedValue(1),
    });
    const repo = new UsersRepository(prisma);

    const result = await repo.findAll();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10, where: {} }),
    );
    expect(result).toEqual({ data: [userFixture], total: 1, skip: 0, take: 10 });
  });

  it('filters by role', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([adminFixture]),
      userCount: jest.fn().mockResolvedValue(1),
    });
    const repo = new UsersRepository(prisma);
    const filters: UsersFilters = { role: 'ADMIN' };

    await repo.findAll(filters);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'ADMIN' } }),
    );
  });

  it('filters by email (contains)', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([]),
      userCount: jest.fn().mockResolvedValue(0),
    });
    const repo = new UsersRepository(prisma);

    await repo.findAll({ email: 'alice' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { contains: 'alice' } } }),
    );
  });

  it('filters by firstName and lastName', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([]),
      userCount: jest.fn().mockResolvedValue(0),
    });
    const repo = new UsersRepository(prisma);

    await repo.findAll({ firstName: 'Al', lastName: 'Smith' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { firstName: { contains: 'Al' }, lastName: { contains: 'Smith' } },
      }),
    );
  });

  it('combines role + email filters', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([]),
      userCount: jest.fn().mockResolvedValue(0),
    });
    const repo = new UsersRepository(prisma);

    await repo.findAll({ role: 'USER', email: 'alice' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'USER', email: { contains: 'alice' } },
      }),
    );
  });

  it('applies custom pagination', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([]),
      userCount: jest.fn().mockResolvedValue(0),
    });
    const repo = new UsersRepository(prisma);

    await repo.findAll(undefined, { skip: 20, take: 5 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 5 }),
    );
  });

  it('excludes password field from returned data', async () => {
    const prisma = makePrisma({
      userFindMany: jest.fn().mockResolvedValue([userFixture]),
      userCount: jest.fn().mockResolvedValue(1),
    });
    const repo = new UsersRepository(prisma);

    await repo.findAll();

    const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
    expect(call.select).toBeDefined();
    expect(call.select.password).toBeUndefined();
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('UsersRepository.create', () => {
  it('creates a user with default role when role is not provided', async () => {
    const prisma = makePrisma({ userCreate: jest.fn().mockResolvedValue(userFixture) });
    const repo = new UsersRepository(prisma);
    const input: UsersCreateInput = {
      email: 'alice@example.com',
      password: 'hashed',
      firstName: 'Alice',
      lastName: 'Smith',
    };

    const result = await repo.create(input);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
    expect(result).toEqual(userFixture);
  });

  it('creates a user with an explicit ADMIN role', async () => {
    const prisma = makePrisma({ userCreate: jest.fn().mockResolvedValue(adminFixture) });
    const repo = new UsersRepository(prisma);
    const input: UsersCreateInput = { ...userFixture, role: 'ADMIN' };

    await repo.create(input);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: 'ADMIN' }),
    });
  });

  it('creates a user with SYSTEM_ADMIN role', async () => {
    const prisma = makePrisma({ userCreate: jest.fn().mockResolvedValue(sysAdminFixture) });
    const repo = new UsersRepository(prisma);

    await repo.create({ ...userFixture, role: 'SYSTEM_ADMIN' });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: 'SYSTEM_ADMIN' }),
    });
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('UsersRepository.update', () => {
  it('updates allowed scalar fields', async () => {
    const updated = { ...userFixture, firstName: 'Alicia' };
    const prisma = makePrisma({ userUpdate: jest.fn().mockResolvedValue(updated) });
    const repo = new UsersRepository(prisma);
    const data: UsersUpdateInput = { firstName: 'Alicia' };

    const result = await repo.update('user-1', data);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { firstName: 'Alicia' },
    });
    expect(result).toEqual(updated);
  });

  it('updates role field', async () => {
    const prisma = makePrisma({ userUpdate: jest.fn().mockResolvedValue(adminFixture) });
    const repo = new UsersRepository(prisma);

    await repo.update('user-1', { role: 'ADMIN' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'ADMIN' },
    });
  });

  it('updates multiple fields including role', async () => {
    const prisma = makePrisma({ userUpdate: jest.fn().mockResolvedValue(adminFixture) });
    const repo = new UsersRepository(prisma);

    await repo.update('user-1', { email: 'new@example.com', role: 'ADMIN' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { email: 'new@example.com', role: 'ADMIN' },
    });
  });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe('UsersRepository.delete', () => {
  it('deletes a regular USER', async () => {
    const prisma = makePrisma({
      userFindUnique: jest.fn().mockResolvedValue(userFixture),
      userDelete: jest.fn().mockResolvedValue(userFixture),
    });
    const repo = new UsersRepository(prisma);

    const result = await repo.delete('user-1');

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual(userFixture);
  });

  it('deletes an ADMIN user', async () => {
    const prisma = makePrisma({
      userFindUnique: jest.fn().mockResolvedValue(adminFixture),
      userDelete: jest.fn().mockResolvedValue(adminFixture),
    });
    const repo = new UsersRepository(prisma);

    await expect(repo.delete('admin-1')).resolves.toEqual(adminFixture);
  });

  it('throws when attempting to delete a SYSTEM_ADMIN', async () => {
    const prisma = makePrisma({
      userFindUnique: jest.fn().mockResolvedValue(sysAdminFixture),
      userDelete: jest.fn(),
    });
    const repo = new UsersRepository(prisma);

    await expect(repo.delete('sys-1')).rejects.toThrow('Cannot delete a SYSTEM_ADMIN account');
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('throws when user is not found', async () => {
    const prisma = makePrisma({
      userFindUnique: jest.fn().mockResolvedValue(null),
      userDelete: jest.fn(),
    });
    const repo = new UsersRepository(prisma);

    await expect(repo.delete('ghost-id')).rejects.toThrow('User not found');
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});

// ─── Class contract ───────────────────────────────────────────────────────────

describe('UsersRepository class contract', () => {
  it('is constructible with a PrismaClient', () => {
    const prisma = makePrisma();
    expect(() => new UsersRepository(prisma)).not.toThrow();
  });

  it('exposes all required methods', () => {
    const proto = UsersRepository.prototype as unknown as Record<string, unknown>;
    for (const method of ['findById', 'findAll', 'create', 'update', 'delete']) {
      expect(typeof proto[method]).toBe('function');
    }
  });
});
