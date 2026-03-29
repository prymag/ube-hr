import { UsersService } from '../users.service';
import type { UsersRepository } from '../users.repository';
import type { AuthService } from '../../auth/auth.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userFixture = {
  id: 'user-1',
  email: 'alice@example.com',
  password: 'hashed-pw',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminFixture = { ...userFixture, id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' as const };
const sysAdminFixture = { ...userFixture, id: 'sys-1', email: 'sys@example.com', role: 'SYSTEM_ADMIN' as const };

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<jest.Mocked<UsersRepository>> = {}): jest.Mocked<UsersRepository> {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(userFixture),
    findAll: jest.fn().mockResolvedValue({ data: [userFixture], total: 1, skip: 0, take: 10 }),
    create: jest.fn().mockResolvedValue(userFixture),
    update: jest.fn().mockResolvedValue(userFixture),
    delete: jest.fn().mockResolvedValue(userFixture),
    ...overrides,
  } as unknown as jest.Mocked<UsersRepository>;
}

function makeAuthService(hashedPw = 'hashed-pw'): jest.Mocked<AuthService> {
  return {
    hashPassword: jest.fn().mockResolvedValue(hashedPw),
  } as unknown as jest.Mocked<AuthService>;
}

// ─── createUser ───────────────────────────────────────────────────────────────

describe('UsersService.createUser', () => {
  const input = {
    email: 'new@example.com',
    password: 'PlainPass1',
    firstName: 'New',
    lastName: 'User',
  };

  it('SYSTEM_ADMIN can create a USER', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    const result = await svc.createUser(input, 'SYSTEM_ADMIN');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-pw', role: 'USER' }),
    );
    expect(result).not.toHaveProperty('password');
  });

  it('SYSTEM_ADMIN can create an ADMIN', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.createUser({ ...input, role: 'ADMIN' }, 'SYSTEM_ADMIN');

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }));
  });

  it('SYSTEM_ADMIN can create a SYSTEM_ADMIN', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.createUser({ ...input, role: 'SYSTEM_ADMIN' }, 'SYSTEM_ADMIN');

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'SYSTEM_ADMIN' }));
  });

  it('ADMIN can create a USER', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.createUser(input, 'ADMIN');

    expect(repo.create).toHaveBeenCalled();
  });

  it('ADMIN cannot create an ADMIN', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.createUser({ ...input, role: 'ADMIN' }, 'ADMIN')).rejects.toThrow(
      'ADMIN cannot assign ADMIN or SYSTEM_ADMIN role',
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('ADMIN cannot create a SYSTEM_ADMIN', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.createUser({ ...input, role: 'SYSTEM_ADMIN' }, 'ADMIN')).rejects.toThrow(
      'ADMIN cannot assign ADMIN or SYSTEM_ADMIN role',
    );
  });

  it('USER cannot create any user', async () => {
    const svc = new UsersService(makeRepo(), makeAuthService());

    await expect(svc.createUser(input, 'USER')).rejects.toThrow(
      'Insufficient permissions to create users',
    );
  });

  it('throws when email already exists', async () => {
    const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.createUser(input, 'SYSTEM_ADMIN')).rejects.toThrow(
      'A user with this email already exists',
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('hashes the password before saving', async () => {
    const authSvc = makeAuthService('super-hashed');
    const repo = makeRepo();
    const svc = new UsersService(repo, authSvc);

    await svc.createUser(input, 'SYSTEM_ADMIN');

    expect(authSvc.hashPassword).toHaveBeenCalledWith(input.password);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ password: 'super-hashed' }));
  });

  it('strips password from returned user', async () => {
    const svc = new UsersService(makeRepo(), makeAuthService());
    const result = await svc.createUser(input, 'SYSTEM_ADMIN');
    expect(result).not.toHaveProperty('password');
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe('UsersService.updateUser', () => {
  it('SYSTEM_ADMIN can update any user', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await svc.updateUser('user-1', { firstName: 'Updated' }, 'SYSTEM_ADMIN');

    expect(repo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ firstName: 'Updated' }));
  });

  it('SYSTEM_ADMIN can promote USER to ADMIN', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await svc.updateUser('user-1', { role: 'ADMIN' }, 'SYSTEM_ADMIN');

    expect(repo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ role: 'ADMIN' }));
  });

  it('ADMIN can update a USER', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await svc.updateUser('user-1', { lastName: 'New' }, 'ADMIN');

    expect(repo.update).toHaveBeenCalled();
  });

  it('ADMIN cannot update a SYSTEM_ADMIN', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(sysAdminFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.updateUser('sys-1', { firstName: 'Hacked' }, 'ADMIN')).rejects.toThrow(
      'ADMIN cannot modify a SYSTEM_ADMIN account',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('ADMIN cannot assign ADMIN role', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.updateUser('user-1', { role: 'ADMIN' }, 'ADMIN')).rejects.toThrow(
      'ADMIN cannot assign ADMIN or SYSTEM_ADMIN role',
    );
  });

  it('ADMIN cannot assign SYSTEM_ADMIN role', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.updateUser('user-1', { role: 'SYSTEM_ADMIN' }, 'ADMIN')).rejects.toThrow(
      'ADMIN cannot assign ADMIN or SYSTEM_ADMIN role',
    );
  });

  it('USER cannot update users', async () => {
    const svc = new UsersService(makeRepo(), makeAuthService());

    await expect(svc.updateUser('user-1', { firstName: 'X' }, 'USER')).rejects.toThrow(
      'Insufficient permissions to update users',
    );
  });

  it('throws when target user is not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.updateUser('ghost', { firstName: 'X' }, 'SYSTEM_ADMIN')).rejects.toThrow(
      'User not found',
    );
  });

  it('hashes password when password is included in update', async () => {
    const authSvc = makeAuthService('re-hashed');
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, authSvc);

    await svc.updateUser('user-1', { password: 'NewPass1' }, 'SYSTEM_ADMIN');

    expect(authSvc.hashPassword).toHaveBeenCalledWith('NewPass1');
    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ password: 're-hashed' }),
    );
  });

  it('does NOT hash password when password is not in update', async () => {
    const authSvc = makeAuthService();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, authSvc);

    await svc.updateUser('user-1', { firstName: 'Alice' }, 'SYSTEM_ADMIN');

    expect(authSvc.hashPassword).not.toHaveBeenCalled();
  });

  it('strips password from returned user', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(userFixture) });
    const svc = new UsersService(repo, makeAuthService());

    const result = await svc.updateUser('user-1', { firstName: 'X' }, 'SYSTEM_ADMIN');
    expect(result).not.toHaveProperty('password');
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe('UsersService.deleteUser', () => {
  it('SYSTEM_ADMIN can delete a USER', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.deleteUser('user-1', 'SYSTEM_ADMIN');

    expect(repo.delete).toHaveBeenCalledWith('user-1');
  });

  it('ADMIN can delete a USER', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.deleteUser('user-1', 'ADMIN');

    expect(repo.delete).toHaveBeenCalledWith('user-1');
  });

  it('USER cannot delete users', async () => {
    const svc = new UsersService(makeRepo(), makeAuthService());

    await expect(svc.deleteUser('user-1', 'USER')).rejects.toThrow(
      'Insufficient permissions to delete users',
    );
    expect(makeRepo().delete).not.toHaveBeenCalled();
  });

  it('propagates repository error for SYSTEM_ADMIN targets', async () => {
    const repo = makeRepo({
      delete: jest.fn().mockRejectedValue(new Error('Cannot delete a SYSTEM_ADMIN account')),
    });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.deleteUser('sys-1', 'SYSTEM_ADMIN')).rejects.toThrow(
      'Cannot delete a SYSTEM_ADMIN account',
    );
  });

  it('propagates repository error for not-found users', async () => {
    const repo = makeRepo({ delete: jest.fn().mockRejectedValue(new Error('User not found')) });
    const svc = new UsersService(repo, makeAuthService());

    await expect(svc.deleteUser('ghost', 'ADMIN')).rejects.toThrow('User not found');
  });
});

// ─── listUsers ────────────────────────────────────────────────────────────────

describe('UsersService.listUsers', () => {
  it('returns paginated users without passwords', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    const result = await svc.listUsers();

    expect(repo.findAll).toHaveBeenCalledWith(undefined, undefined);
    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.total).toBe(1);
  });

  it('passes filters to repository', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.listUsers({ role: 'ADMIN', email: 'admin' });

    expect(repo.findAll).toHaveBeenCalledWith({ role: 'ADMIN', email: 'admin' }, undefined);
  });

  it('passes pagination to repository', async () => {
    const repo = makeRepo();
    const svc = new UsersService(repo, makeAuthService());

    await svc.listUsers(undefined, { skip: 10, take: 5 });

    expect(repo.findAll).toHaveBeenCalledWith(undefined, { skip: 10, take: 5 });
  });

  it('strips password from every item in the result list', async () => {
    const multiRepo = makeRepo({
      findAll: jest.fn().mockResolvedValue({
        data: [userFixture, adminFixture],
        total: 2,
        skip: 0,
        take: 10,
      }),
    });
    const svc = new UsersService(multiRepo, makeAuthService());

    const result = await svc.listUsers();

    result.data.forEach((u) => expect(u).not.toHaveProperty('password'));
    expect(result.data).toHaveLength(2);
  });
});

// ─── Class contract ───────────────────────────────────────────────────────────

describe('UsersService class contract', () => {
  it('is constructible with repository and authService', () => {
    expect(() => new UsersService(makeRepo(), makeAuthService())).not.toThrow();
  });

  it('exposes all required methods', () => {
    const proto = UsersService.prototype as unknown as Record<string, unknown>;
    for (const m of ['createUser', 'updateUser', 'deleteUser', 'listUsers']) {
      expect(typeof proto[m]).toBe('function');
    }
  });
});
