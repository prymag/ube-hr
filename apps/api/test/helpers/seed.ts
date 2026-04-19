import { INestApplication } from '@nestjs/common';
import { PrismaService, Role } from '@ube-hr/backend';
import supertest from 'supertest';

export interface SeedUserOptions {
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
  status?: 'ACTIVE' | 'BLOCKED';
}

/**
 * Create a user directly in the database with an argon2-hashed password.
 * Password defaults to 'password123'.
 */
export async function seedUser(app: INestApplication, options: SeedUserOptions = {}) {
  const { secrets } = await import('@ube-hr/backend');
  const prisma = app.get(PrismaService);
  const password = options.password ?? 'password123';
  return prisma.user.create({
    data: {
      email: options.email ?? 'user@test.com',
      password: await secrets.hash(password),
      name: options.name,
      role: options.role ?? Role.USER,
      status: (options.status ?? 'ACTIVE') as any,
    },
  });
}

/**
 * Login and return the access token.
 */
export async function login(
  request: ReturnType<typeof supertest>,
  email: string,
  password = 'password123',
): Promise<string> {
  const res = await request.post('/api/auth/login').send({ email, password });
  return res.body.access_token as string;
}

/**
 * Seed a user and immediately log in, returning both the user record and token.
 */
export async function seedAndLogin(
  app: INestApplication,
  request: ReturnType<typeof supertest>,
  options: SeedUserOptions = {},
) {
  const password = options.password ?? 'password123';
  const user = await seedUser(app, { ...options, password });
  const token = await login(request, user.email, password);
  return { user, token };
}
