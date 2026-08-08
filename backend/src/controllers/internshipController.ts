import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import { protect, authorize } from '../middleware/authMiddleware';

// @desc    Get all internships
// @route   GET /api/internships
// @access  Private
export const getInternships = asyncHandler(async (req: Request, res: Response) => {
  const internships = await prisma.internship.findMany({
    include: {
      mentor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      interns: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(internships);
});

// @desc    Get internship by ID
// @route   GET /api/internships/:id
// @access  Private
export const getInternshipById = asyncHandler(async (req: Request, res: Response) => {
  const internship = await prisma.internship.findUnique({
    where: { id: req.params.id },
    include: {
      mentor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      interns: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      applications: {
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
      },
    },
  });

  if (internship) {
    res.json(internship);
  } else {
    res.status(404);
    throw new Error('Internship not found');
  }
});

// @desc    Create internship
// @route   POST /api/internships
// @access  Private/Admin, HR
export const createInternship = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, department, mentorId, startDate, endDate, maxInterns } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Program Title is required');
  }

  let assignedMentorId = mentorId;

  // Validate mentor exists if mentorId provided; otherwise default to logged in user
  if (assignedMentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: assignedMentorId },
    });
    if (!mentor) {
      assignedMentorId = req.user!.id;
    }
  } else {
    assignedMentorId = req.user!.id;
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 86400000);

  const internship = await prisma.internship.create({
    data: {
      title,
      description: description || title,
      department: department || 'General',
      mentorId: assignedMentorId,
      startDate: start,
      endDate: end,
      maxInterns: maxInterns ? Number(maxInterns) : 999,
    },
  });

  res.status(201).json(internship);
});

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private/Admin, HR
export const updateInternship = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, department, startDate, endDate, maxInterns, status } = req.body;

  const internship = await prisma.internship.findUnique({
    where: { id: req.params.id },
  });

  if (internship) {
    internship.title = title || internship.title;
    internship.description = description || internship.description;
    internship.department = department || internship.department;
    internship.startDate = startDate ? new Date(startDate) : internship.startDate;
    internship.endDate = endDate ? new Date(endDate) : internship.endDate;
    internship.maxInterns = maxInterns !== undefined ? maxInterns : internship.maxInterns;
    internship.status = status || internship.status;

    const updatedInternship = await prisma.internship.update({
      where: { id: internship.id },
      data: {
        title: internship.title,
        description: internship.description,
        department: internship.department,
        startDate: internship.startDate,
        endDate: internship.endDate,
        maxInterns: internship.maxInterns,
        status: internship.status,
      },
    });

    res.json(updatedInternship);
  } else {
    res.status(404);
    throw new Error('Internship not found');
  }
});

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private/Admin, HR
export const deleteInternship = asyncHandler(async (req: Request, res: Response) => {
  const internship = await prisma.internship.findUnique({
    where: { id: req.params.id },
  });

  if (internship) {
    await prisma.internship.delete({
      where: { id: internship.id },
    });
    res.json({ message: 'Internship removed' });
  } else {
    res.status(404);
    throw new Error('Internship not found');
  }
});

// @desc    Assign intern to internship
// @route   POST /api/internships/:id/interns
// @access  Private/Admin, HR, Mentor
export const assignInternToInternship = asyncHandler(async (req: Request, res: Response) => {
  const { internId } = req.body;
  const internshipId = req.params.id;

  // Check if internship exists
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
  });

  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  // Check if intern exists
  const intern = await prisma.user.findUnique({
    where: { id: internId },
  });

  if (!intern) {
    res.status(400);
    throw new Error('Intern not found');
  }

  // Check if intern is already assigned to this internship
  const existingAssignment = await prisma.internship.findFirst({
    where: {
      id: internshipId,
      interns: {
        some: {
          id: internId,
        },
      },
    },
  });

  if (existingAssignment) {
    res.status(400);
    throw new Error('Intern is already assigned to this internship');
  }

  // Check if internship is at capacity
  const currentInternCount = await prisma.internship.count({
    where: {
      id: internshipId,
      interns: {
        some: {},
      },
    },
  });

  if (currentInternCount >= internship.maxInterns) {
    res.status(400);
    throw new Error('Internship is at maximum capacity');
  }

  // Assign intern to internship
  await prisma.internship.update({
    where: { id: internshipId },
    data: {
      interns: {
        connect: { id: internId },
      },
    },
  });

  res.json({ message: 'Intern assigned to internship' });
});

// @desc    Remove intern from internship
// @route   DELETE /api/internships/:id/interns/:internId
// @access  Private/Admin, HR, Mentor
export const removeInternFromInternship = asyncHandler(async (req: Request, res: Response) => {
  const { internId } = req.params;
  const internshipId = req.params.id;

  // Check if internship exists
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
  });

  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  // Remove intern from internship
  await prisma.internship.update({
    where: { id: internshipId },
    data: {
      interns: {
        disconnect: { id: internId },
      },
    },
  });

  res.json({ message: 'Intern removed from internship' });
});