import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_PASSWORD = 'Admin@123'; // Change this in production!

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Check if system admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@ube-hr.com' },
    });

    if (existingAdmin) {
      console.log('✅ System admin already exists. Skipping seed.');
      return;
    }

    // Hash the password with bcrypt (salt rounds >= 10)
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create system admin user
    const systemAdmin = await prisma.user.create({
      data: {
        email: 'admin@ube-hr.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'SYSTEM_ADMIN',
      },
    });

    console.log('✅ System admin created successfully');
    console.log(`   Email: ${systemAdmin.email}`);
    console.log(`   Role: ${systemAdmin.role}`);
    console.log(`   ID: ${systemAdmin.id}`);
    console.log(`\n⚠️  Initial password: ${ADMIN_PASSWORD}`);
    console.log(`   Please change this password in production!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
