import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { protect, authorize } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  // Build where clause based on user role
  let whereClause: any = {};

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see all projects
    whereClause = {};
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see projects for interns they mentor
    whereClause = {
      intern: {
        internships: {
          some: {
            mentorId: req.user.id,
          },
        },
      },
    };
  } else {
    // Interns can only see their own projects
    whereClause = {
      internId: req.user.id,
    };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      intern: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      internship: {
        select: {
          id: true,
          title: true,
          department: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(projects);
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      intern: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      internship: {
        select: {
          id: true,
          title: true,
          department: true,
          mentorId: true,
        },
      },
      tasks: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (project) {
    // Check if user has permission to view this project
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Check if mentor oversees the intern's internship
      const internship = project.internship;
      if (internship && internship.mentorId === req.user.id) {
        hasPermission = true;
      }
    } else {
      // Intern can view their own projects
      if (project.internId === req.user.id) {
        hasPermission = true;
      }
    }

    if (hasPermission) {
      res.json(project);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this project');
    }
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Mentor, Admin, HR
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, internId, internshipId, startDate, endDate, priority } = req.body;

  // Check if intern exists
  const intern = await prisma.user.findUnique({
    where: { id: internId },
  });

  if (!intern) {
    res.status(400);
    throw new Error('Intern not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Check if mentor oversees this intern
    const internship = await prisma.internship.findFirst({
      where: {
        mentorId: req.user.id,
        interns: {
          some: {
            id: internId,
          },
        },
      },
    });

    if (internship) {
      // If internshipId is provided, check if it matches
      if (!internshipId || internshipId === internship.id) {
        hasPermission = true;
      }
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to create project for this intern');
  }

  // If internshipId is provided, verify it's correct
  if (internshipId) {
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      res.status(400);
      throw new Error('Internship not found');
    }

    // Check if intern is actually in this internship
    const isInternInInternship = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        interns: {
          some: {
            id: internId,
          },
        },
      },
    });

    if (!isInternInInternship) {
      res.status(400);
      throw new Error('Intern is not part of this internship');
    }
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      internId,
      internshipId: internshipId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      priority: priority || 'MEDIUM',
    },
  });

  res.status(201).json(project);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Mentor, Admin, HR
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (project) {
    // Check permissions
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Check if mentor oversees the intern's internship
      const internship = await prisma.internship.findFirst({
        where: {
          interns: {
            some: {
              id: project.internId,
            },
          },
          mentorId: req.user.id,
        },
      });

      if (internship) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to update this project');
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        title: req.body.title || project.title,
        description: req.body.description || project.description,
        startDate: req.body.startDate ? new Date(req.body.startDate) : project.startDate,
        endDate: req.body.endDate ? new Date(req.body.endDate) : project.endDate,
        priority: req.body.priority || project.priority,
      },
    });

    res.json(updatedProject);
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Mentor, Admin, HR
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (project) {
    // Check permissions
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Check if mentor oversees the intern's internship
      const internship = await prisma.internship.findFirst({
        where: {
          interns: {
            some: {
              id: project.internId,
            },
          },
          mentorId: req.user.id,
        },
      });

      if (internship) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to delete this project');
    }

    await prisma.project.delete({
      where: { id: project.id },
    });
    res.json({ message: 'Project removed' });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});