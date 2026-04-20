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

const SEED_DEPARTMENTS = [
  {
    name: 'Engineering',
    description: 'Software development and infrastructure',
  },
  {
    name: 'Human Resources',
    description: 'People operations and talent management',
  },
  { name: 'Finance', description: 'Financial planning and accounting' },
  { name: 'Marketing', description: 'Brand, growth and communications' },
  { name: 'Operations', description: 'Business processes and logistics' },
];

const SEED_POSITIONS = [
  {
    name: 'Software Engineer',
    description: 'Designs and builds software systems',
  },
  {
    name: 'Senior Software Engineer',
    description: 'Leads technical work and mentors engineers',
  },
  {
    name: 'Engineering Manager',
    description: 'Manages engineering teams and delivery',
  },
  {
    name: 'HR Specialist',
    description: 'Handles recruitment and employee relations',
  },
  { name: 'HR Manager', description: 'Leads the HR function and policy' },
  {
    name: 'Financial Analyst',
    description: 'Analyses budgets and financial reports',
  },
  { name: 'Accountant', description: 'Manages accounts and financial records' },
  { name: 'Marketing Specialist', description: 'Executes marketing campaigns' },
  {
    name: 'Marketing Manager',
    description: 'Leads marketing strategy and team',
  },
  {
    name: 'Operations Coordinator',
    description: 'Coordinates day-to-day operations',
  },
];

async function main() {
  // Seed one user per role
  const users = await Promise.all(
    Object.values(Role).map(async (role) => {
      const email = `${role.toLowerCase().replace('_', '.')}@example.com`;
      const name =
        role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ');
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
  for (const [role, permissions] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS,
  ) as [Role, string[]][]) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: {},
        create: { role, permission },
      });
    }
  }

  // Seed departments
  const departments = await Promise.all(
    SEED_DEPARTMENTS.map((dept) =>
      prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: dept,
      }),
    ),
  );

  // Seed positions
  const positions = await Promise.all(
    SEED_POSITIONS.map((pos) =>
      prisma.position.upsert({
        where: { name: pos.name },
        update: {},
        create: pos,
      }),
    ),
  );

  console.log(
    'Seeded users:',
    users.map((u) => `${u.email} (${u.role})`),
  );
  console.log(
    'Seeded departments:',
    departments.map((d) => d.name),
  );
  console.log(
    'Seeded positions:',
    positions.map((p) => p.name),
  );
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
