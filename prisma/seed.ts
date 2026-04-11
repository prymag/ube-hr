import 'dotenv/config';
import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { DEFAULT_ROLE_PERMISSIONS } from '@ube-hr/shared';
import { secrets } from '@ube-hr/backend';

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed one user per role
  const users = await Promise.all(
    Object.values(Role).map(async (role) => {
      const email = `${role.toLowerCase().replace('_', '.')}@example.com`;
      const name = role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ');
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          role,
          password: await secrets.hash('password123'),
        },
      });
    }),
  );

  // Seed role permissions
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS) as [Role, string[]][]) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: {},
        create: { role, permission },
      });
    }
  }

  console.log('Seeded users:', users.map((u) => `${u.email} (${u.role})`));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
