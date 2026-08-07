import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@experimindlabs.com' },
    update: {},
    create: {
      email: 'admin@experimindlabs.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'IT',
      position: 'System Administrator',
      isActive: true,
    },
  });

  // Create HR user
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@experimindlabs.com' },
    update: {},
    create: {
      email: 'hr@experimindlabs.com',
      password: hashedPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR',
      department: 'Human Resources',
      position: 'HR Manager',
      isActive: true,
    },
  });

  // Create mentor user
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@experimindlabs.com' },
    update: {},
    create: {
      email: 'mentor@experimindlabs.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Mentor',
      role: 'MENTOR',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      isActive: true,
    },
  });

  // Create intern user
  const intern = await prisma.user.upsert({
    where: { email: 'intern@experimindlabs.com' },
    update: {},
    create: {
      email: 'intern@experimindlabs.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Intern',
      role: 'INTERN',
      department: 'Engineering',
      position: 'Software Engineering Intern',
      isActive: true,
    },
  });

  // Create sample internship
  const internship = await prisma.internship.upsert({
    where: { id: 'internship-1' },
    update: {},
    create: {
      title: 'Software Engineering Internship',
      description: 'A 3-month internship focused on full-stack web development',
      department: 'Engineering',
      mentorId: mentor.id,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      maxInterns: 2,
    },
  });

  // Assign intern to internship
  await prisma.internship.update({
    where: { id: internship.id },
    data: {
      interns: {
        connect: { id: intern.id },
      },
    },
  });

  // Create sample application
  const application = await prisma.application.upsert({
    where: { id: 'application-1' },
    update: {},
    create: {
      internshipId: internship.id,
      applicantId: intern.id,
      status: 'ACCEPTED',
      appliedAt: new Date('2024-04-01'),
      reviewedAt: new Date('2024-04-15'),
      reviewerId: hrUser.id,
    },
  });

  // Create sample project
  const project = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      title: 'Intern Management System',
      description: 'Building the intern management system for Experimind Labs',
      internId: intern.id,
      internshipId: internship.id,
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-08-15'),
      priority: 'HIGH',
    },
  });

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design database schema',
        description: 'Create the database schema for user, internship, and application entities',
        projectId: project.id,
        assignedTo: intern.id,
        dueDate: new Date('2024-06-20'),
        estimatedHours: 8,
        priority: 'HIGH',
        status: 'DONE',
      },
      {
        title: 'Implement authentication system',
        description: 'Build login, registration, and JWT-based authentication',
        projectId: project.id,
        assignedTo: intern.id,
        dueDate: new Date('2024-07-01'),
        estimatedHours: 16,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      },
      {
        title: 'Create user management interface',
        description: 'Build CRUD operations for user management',
        projectId: project.id,
        assignedTo: intern.id,
        dueDate: new Date('2024-07-15'),
        estimatedHours: 12,
        priority: 'MEDIUM',
        status: 'TODO',
      },
    ],
  });

  // Create sample evaluation
  await prisma.evaluation.upsert({
    where: { id: 'evaluation-1' },
    update: {},
    create: {
      internId: intern.id,
      evaluatorId: mentor.id,
      internshipId: internship.id,
      periodStart: new Date('2024-06-01'),
      periodEnd: new Date('2024-06-30'),
      scores: {
        technicalSkills: 8,
        communication: 7,
        teamwork: 9,
        problemSolving: 8,
      },
      feedback: 'Jane has shown great progress in her first month. She quickly picked up our tech stack and has been contributing to the intern management system.',
      strengths: 'Quick learner, attention to detail, good communication skills',
      areasForImprovement: 'Could benefit from more experience with backend optimization',
      goalsNextPeriod: 'Lead a small feature independently, improve database query performance',
      overallRating: 8.0,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });