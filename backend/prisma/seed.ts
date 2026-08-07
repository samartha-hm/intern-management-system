/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@experimindlabs.com' },
    update: {},
    create: {
      email: 'admin@experimindlabs.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'Management',
      position: 'System Administrator',
    },
  });

  // 2. HR
  const hr = await prisma.user.upsert({
    where: { email: 'hr@experimindlabs.com' },
    update: {},
    create: {
      email: 'hr@experimindlabs.com',
      password: hashedPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR',
      department: 'Human Resources',
      position: 'HR Lead',
    },
  });

  // 3. Mentor
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@experimindlabs.com' },
    update: {},
    create: {
      email: 'mentor@experimindlabs.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'MENTOR',
      department: 'Engineering',
      position: 'Senior Software Engineer',
    },
  });

  // 4. Intern
  const intern = await prisma.user.upsert({
    where: { email: 'intern@experimindlabs.com' },
    update: {},
    create: {
      email: 'intern@experimindlabs.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'INTERN',
      department: 'Engineering',
      position: 'Software Engineering Intern',
    },
  });

  console.log('Created sample users:');
  console.log(' - Admin: admin@experimindlabs.com / password123');
  console.log(' - HR: hr@experimindlabs.com / password123');
  console.log(' - Mentor: mentor@experimindlabs.com / password123');
  console.log(' - Intern: intern@experimindlabs.com / password123');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
