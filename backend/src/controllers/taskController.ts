import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { protect, authorize } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  // Build where clause based on user role
  let whereClause: any = {};

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see all tasks
    whereClause = {};
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see tasks for projects they oversee
    whereClause = {
      project: {
        intern: {
          internships: {
            some: {
              mentorId: req.user.id,
            },
          },
        },
      },
    };
  } else {
    // Interns can only see tasks assigned to them or in their projects
    whereClause = {
      OR: [
        { assignedTo: req.user.id },
        {
          project: {
            internId: req.user.id,
          },
        },
      ],
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      project: {
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
        },
      },
      assignedToUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(tasks);
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      project: {
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
        },
      },
      assignedToUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (task) {
    // Check if user has permission to view this task
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Check if mentor oversees the project's intern
      const projectId = task.projectId;
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          intern: {
            include: {
              internships: {
                where: {
                  mentorId: req.user.id,
                },
              },
            },
          },
        },
      });

      if (project && project.intern && project.intern.internships.some((i: any) => i.mentorId === req.user.id)) {
        hasPermission = true;
      }
    } else {
      // Intern can view if assigned to them or in their project
      if (task.assignedTo === req.user.id || task.project?.internId === req.user.id) {
        hasPermission = true;
      }
    }

    if (hasPermission) {
      res.json(task);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this task');
    }
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, projectId, assignedTo, dueDate, estimatedHours, priority } = req.body;

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    res.status(400);
    throw new Error('Project not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can create any task
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can create tasks for projects they oversee
    const projectInternship = await prisma.internship.findFirst({
      where: {
        interns: {
          some: {
            id: project.internId,
          },
        },
        mentorId: req.user.id,
      },
    });

    if (projectInternship) {
      hasPermission = true;
    }
  } else {
    // Interns can only create tasks for their own projects
    if (project.internId === req.user.id) {
      // Interns can only assign tasks to themselves
      if (!assignedTo || assignedTo === req.user.id) {
        hasPermission = true;
      }
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to create task for this project');
  }

  // If assignedTo is provided, validate the user exists
  if (assignedTo) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedTo },
    });

    if (!assignee) {
      res.status(400);
      throw new Error('Assignee not found');
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours || 0,
      priority: priority || 'MEDIUM',
    },
  });

  res.status(201).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
  });

  if (task) {
    // Check permissions
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      // Admin and HR can update any task
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Mentors can update tasks for projects they oversee
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: {
          intern: {
            include: {
              internships: {
                where: {
                  mentorId: req.user.id,
                },
              },
            },
          },
        },
      });

      if (project && project.intern && project.intern.internships.some((i: any) => i.mentorId === req.user.id)) {
        hasPermission = true;
      }
    } else {
      // Interns can update tasks assigned to them
      if (task.assignedTo === req.user.id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }

    // If assignedTo is provided, validate the user exists
    if (req.body.assignedTo !== undefined) {
      if (req.body.assignedTo !== null) {
        const assignee = await prisma.user.findUnique({
          where: { id: req.body.assignedTo },
        });

        if (!assignee) {
          res.status(400);
          throw new Error('Assignee not found');
        }
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: req.body.title || task.title,
        description: req.body.description || task.description,
        assignedTo: req.body.assignedTo !== undefined ? req.body.assignedTo : task.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate,
        estimatedHours: req.body.estimatedHours !== undefined ? req.body.estimatedHours : task.estimatedHours,
        actualHours: req.body.actualHours !== undefined ? req.body.actualHours : task.actualHours,
        priority: req.body.priority || task.priority,
        status: req.body.status || task.status,
      },
    });

    res.json(updatedTask);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
  });

  if (task) {
    // Check permissions
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      // Admin and HR can delete any task
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Mentors can delete tasks for projects they oversee
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: {
          intern: {
            include: {
              internships: {
                where: {
                  mentorId: req.user.id,
                },
              },
            },
          },
        },
      });

      if (project && project.intern && project.intern.internships.some((i: any) => i.mentorId === req.user.id)) {
        hasPermission = true;
      }
    } else {
      // Interns can delete tasks assigned to them
      if (task.assignedTo === req.user.id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to delete this task');
    }

    await prisma.task.delete({
      where: { id: task.id },
    });
    res.json({ message: 'Task removed' });
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Get tasks for a specific project
// @route   GET /api/tasks/project/:projectId
// @access  Private
export const getTasksByProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see tasks for any project
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see tasks for projects they oversee
    const projectInternship = await prisma.internship.findFirst({
      where: {
        interns: {
          some: {
            id: project.internId,
          },
        },
        mentorId: req.user.id,
      },
    });

    if (projectInternship) {
      hasPermission = true;
    }
  } else {
    // Interns can see tasks for their own projects
    if (project.internId === req.user.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view tasks for this project');
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedToUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  res.json(tasks);
});

// @desc    Get tasks assigned to a specific user
// @route   GET /api/tasks/user/:userId
// @access  Private
export const getTasksByUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see tasks for any user
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see tasks assigned to users they oversee
    const userInternship = await prisma.internship.findFirst({
      where: {
        interns: {
          some: {
            id: userId,
          },
        },
        mentorId: req.user.id,
      },
    });

    if (userInternship) {
      hasPermission = true;
    }
  } else {
    // Users can only see their own tasks
    if (userId === req.user.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view tasks for this user');
  }

  const tasks = await prisma.task.findMany({
    where: { assignedTo: userId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          intern: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  res.json(tasks);
});