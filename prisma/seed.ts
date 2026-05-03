import 'dotenv/config';
import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { DEFAULT_ROLE_PERMISSIONS } from '@ube-hr/shared';
import * as secrets from '../libs/backend/src/secrets';

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
  {
    name: 'Operations Manager',
    description: 'Oversees business processes and logistics',
  },
];

// dept and position are matched by name to the arrays above
type UserSeed = {
  email: string;
  name: string;
  role: Role;
  dept?: string;
  position?: string;
  isDeptHead?: boolean;
};

const SEED_USERS: UserSeed[] = [
  // Named dev/demo accounts (easy to remember)
  { email: 'superadmin@ube-hr.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
  { email: 'admin@ube-hr.com', name: 'Admin', role: Role.ADMIN },
  {
    email: 'manager@ube-hr.com',
    name: 'Manager',
    role: Role.MANAGER,
    dept: 'Engineering',
    position: 'Senior Software Engineer',
  },
  {
    email: 'user@ube-hr.com',
    name: 'User',
    role: Role.USER,
    dept: 'Engineering',
    position: 'Software Engineer',
  },

  // Super admin — no dept
  {
    email: 'super.admin@example.com',
    name: 'Super Admin',
    role: Role.SUPER_ADMIN,
  },

  // Engineering
  {
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    role: Role.ADMIN,
    dept: 'Engineering',
    position: 'Engineering Manager',
    isDeptHead: true,
  },
  {
    email: 'bob.smith@example.com',
    name: 'Bob Smith',
    role: Role.MANAGER,
    dept: 'Engineering',
    position: 'Senior Software Engineer',
  },
  {
    email: 'carol.white@example.com',
    name: 'Carol White',
    role: Role.USER,
    dept: 'Engineering',
    position: 'Software Engineer',
  },
  {
    email: 'david.lee@example.com',
    name: 'David Lee',
    role: Role.USER,
    dept: 'Engineering',
    position: 'Software Engineer',
  },
  {
    email: 'ethan.nguyen@example.com',
    name: 'Ethan Nguyen',
    role: Role.USER,
    dept: 'Engineering',
    position: 'Senior Software Engineer',
  },

  // Human Resources
  {
    email: 'fiona.brown@example.com',
    name: 'Fiona Brown',
    role: Role.MANAGER,
    dept: 'Human Resources',
    position: 'HR Manager',
    isDeptHead: true,
  },
  {
    email: 'george.wilson@example.com',
    name: 'George Wilson',
    role: Role.USER,
    dept: 'Human Resources',
    position: 'HR Specialist',
  },
  {
    email: 'hannah.taylor@example.com',
    name: 'Hannah Taylor',
    role: Role.USER,
    dept: 'Human Resources',
    position: 'HR Specialist',
  },

  // Finance
  {
    email: 'ivan.martin@example.com',
    name: 'Ivan Martin',
    role: Role.MANAGER,
    dept: 'Finance',
    position: 'Financial Analyst',
    isDeptHead: true,
  },
  {
    email: 'julia.anderson@example.com',
    name: 'Julia Anderson',
    role: Role.USER,
    dept: 'Finance',
    position: 'Financial Analyst',
  },
  {
    email: 'kevin.thomas@example.com',
    name: 'Kevin Thomas',
    role: Role.USER,
    dept: 'Finance',
    position: 'Accountant',
  },

  // Marketing
  {
    email: 'laura.jackson@example.com',
    name: 'Laura Jackson',
    role: Role.MANAGER,
    dept: 'Marketing',
    position: 'Marketing Manager',
    isDeptHead: true,
  },
  {
    email: 'mike.harris@example.com',
    name: 'Mike Harris',
    role: Role.USER,
    dept: 'Marketing',
    position: 'Marketing Specialist',
  },
  {
    email: 'nina.clark@example.com',
    name: 'Nina Clark',
    role: Role.USER,
    dept: 'Marketing',
    position: 'Marketing Specialist',
  },

  // Operations
  {
    email: 'oscar.robinson@example.com',
    name: 'Oscar Robinson',
    role: Role.MANAGER,
    dept: 'Operations',
    position: 'Operations Manager',
    isDeptHead: true,
  },
  {
    email: 'paula.lewis@example.com',
    name: 'Paula Lewis',
    role: Role.USER,
    dept: 'Operations',
    position: 'Operations Coordinator',
  },
  {
    email: 'quinn.walker@example.com',
    name: 'Quinn Walker',
    role: Role.USER,
    dept: 'Operations',
    position: 'Operations Coordinator',
  },
];

async function main() {
  const refresh = process.argv.includes('--refresh');

  if (refresh) {
    console.log('--refresh: truncating all tables...');
    await prisma.membership.deleteMany();
    await prisma.team.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.leaveApprovalStep.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.leaveBalanceAudit.deleteMany();
    await prisma.leaveBalance.deleteMany();
    await prisma.leaveAccrualConfig.deleteMany();
    await prisma.publicHoliday.deleteMany();
    await prisma.department.updateMany({ data: { headId: null } });
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.position.deleteMany();
    console.log('Truncation complete.\n');
  }

  // 1. Seed role permissions
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

  // 2. Seed departments (no heads yet)
  const departments = new Map<string, { id: number }>();
  for (const dept of SEED_DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    departments.set(dept.name, record);
  }

  // 3. Seed positions (two passes: create first, then set reportsToId)
  const POSITION_REPORTS_TO: Record<string, string> = {
    'Software Engineer': 'Engineering Manager',
    'Senior Software Engineer': 'Engineering Manager',
    'HR Specialist': 'HR Manager',
    'Financial Analyst': 'HR Manager',
    Accountant: 'Financial Analyst',
    'Marketing Specialist': 'Marketing Manager',
    'Operations Coordinator': 'Operations Manager',
  };

  const positions = new Map<string, { id: number }>();
  for (const pos of SEED_POSITIONS) {
    const record = await prisma.position.upsert({
      where: { name: pos.name },
      update: {},
      create: pos,
    });
    positions.set(pos.name, record);
  }

  for (const [posName, reportsToName] of Object.entries(POSITION_REPORTS_TO)) {
    const pos = positions.get(posName);
    const reportsTo = positions.get(reportsToName);
    if (pos && reportsTo) {
      await prisma.position.update({
        where: { id: pos.id },
        data: { reportsToId: reportsTo.id },
      });
    }
  }

  // 4. Seed users with dept + position assignments
  const hashedPassword = await secrets.hash('password123');
  const users: Array<{ id: number; email: string; role: Role }> = [];

  for (const u of SEED_USERS) {
    const deptId = u.dept ? departments.get(u.dept)?.id : undefined;
    const posId = u.position ? positions.get(u.position)?.id : undefined;

    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        ...(deptId !== undefined && { departmentId: deptId }),
        ...(posId !== undefined && { positionId: posId }),
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: hashedPassword,
        ...(deptId !== undefined && { departmentId: deptId }),
        ...(posId !== undefined && { positionId: posId }),
      },
    });
    users.push(record);
  }

  // 5. Set department heads
  for (const u of SEED_USERS) {
    if (!u.isDeptHead || !u.dept) continue;
    const dept = departments.get(u.dept);
    const user = users.find((x) => x.email === u.email);
    if (!dept || !user) continue;

    await prisma.department.update({
      where: { id: dept.id },
      data: { headId: user.id },
    });
  }

  // 6. Seed teams and memberships
  // owner email → member emails
  const SEED_TEAMS: {
    name: string;
    description: string;
    ownerEmail: string;
    memberEmails: string[];
  }[] = [
    {
      name: 'Engineering Team',
      description: 'Core engineering squad responsible for product development',
      ownerEmail: 'alice.johnson@example.com',
      memberEmails: [
        'alice.johnson@example.com',
        'bob.smith@example.com',
        'carol.white@example.com',
        'david.lee@example.com',
        'ethan.nguyen@example.com',
        'manager@ube-hr.com',
        'user@ube-hr.com',
      ],
    },
    {
      name: 'HR Team',
      description: 'People operations and talent acquisition',
      ownerEmail: 'fiona.brown@example.com',
      memberEmails: [
        'fiona.brown@example.com',
        'george.wilson@example.com',
        'hannah.taylor@example.com',
      ],
    },
    {
      name: 'Finance Team',
      description: 'Financial planning, reporting and accounting',
      ownerEmail: 'ivan.martin@example.com',
      memberEmails: [
        'ivan.martin@example.com',
        'julia.anderson@example.com',
        'kevin.thomas@example.com',
      ],
    },
    {
      name: 'Marketing Team',
      description: 'Brand growth, campaigns and communications',
      ownerEmail: 'laura.jackson@example.com',
      memberEmails: [
        'laura.jackson@example.com',
        'mike.harris@example.com',
        'nina.clark@example.com',
      ],
    },
    {
      name: 'Operations Team',
      description: 'Day-to-day business operations and logistics',
      ownerEmail: 'oscar.robinson@example.com',
      memberEmails: [
        'oscar.robinson@example.com',
        'paula.lewis@example.com',
        'quinn.walker@example.com',
      ],
    },
    {
      name: 'Leadership',
      description: 'Cross-functional leadership and strategic planning',
      ownerEmail: 'alice.johnson@example.com',
      memberEmails: [
        'alice.johnson@example.com',
        'bob.smith@example.com',
        'fiona.brown@example.com',
        'ivan.martin@example.com',
        'laura.jackson@example.com',
        'oscar.robinson@example.com',
      ],
    },
  ];

  const userByEmail = new Map(users.map((u) => [u.email, u]));

  for (const t of SEED_TEAMS) {
    const owner = userByEmail.get(t.ownerEmail);
    if (!owner) continue;

    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { description: t.description, ownerId: owner.id },
      create: { name: t.name, description: t.description, ownerId: owner.id },
    });

    for (const email of t.memberEmails) {
      const member = userByEmail.get(email);
      if (!member) continue;
      await prisma.membership.upsert({
        where: { userId_teamId: { userId: member.id, teamId: team.id } },
        update: {},
        create: { userId: member.id, teamId: team.id },
      });
    }
  }

  console.log('Seeded users:');
  for (const u of SEED_USERS) {
    const dept = u.dept ?? '—';
    const pos = u.position ?? '—';
    const head = u.isDeptHead ? ' [dept head]' : '';
    console.log(`  ${u.email} (${u.role}) | ${dept} | ${pos}${head}`);
  }

  console.log('\nDepartment heads:');
  for (const u of SEED_USERS.filter((x) => x.isDeptHead)) {
    console.log(`  ${u.dept}: ${u.name}`);
  }

  console.log('\nSeeded teams:');
  for (const t of SEED_TEAMS) {
    console.log(
      `  ${t.name} (owner: ${t.ownerEmail}) — ${t.memberEmails.length} members`,
    );
  }
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
