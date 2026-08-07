import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import { protect, authorize } from '../middleware/authMiddleware';

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin, HR, Mentor (for their interns)
export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  // Build where clause based on user role
  let whereClause: any = {};

  if (req.user.role === 'HR' || req.user.role === 'ADMIN') {
    // HR and Admin can see all applications
    whereClause = {};
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see applications for internships they mentor
    whereClause = {
      internship: {
        mentorId: req.user.id,
      },
    };
  } else {
    // Interns can only see their own applications
    whereClause = {
      applicantId: req.user.id,
    };
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      applicant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      internship: {
        select: {
          id: true,
          title: true,
          department: true,
          mentor: {
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
      appliedAt: 'desc',
    },
  });

  res.json(applications);
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
export const getApplicationById = asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      applicant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      internship: {
        select: {
          id: true,
          title: true,
          department: true,
          mentorId: true,
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (application) {
    // Check if user has permission to view this application
    const hasPermission =
      req.user.role === 'ADMIN' ||
      req.user.role === 'HR' ||
      (req.user.role === 'MENTOR' && application.internship?.mentorId === req.user.id) ||
      application.applicantId === req.user.id;

    if (hasPermission) {
      res.json(application);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this application');
    }
  } else {
    res.status(404);
    throw new Error('Application not found');
  }
});

// @desc    Create application
// @route   POST /api/applications
// @access  Private/Intern
export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  // Only interns can create applications
  if (req.user.role !== 'INTERN') {
    res.status(403);
    throw new Error('Only interns can apply for internships');
  }

  const { internshipId, ...applicationData } = req.body;

  // Check if internship exists
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
  });

  if (!internship) {
    res.status(400);
    throw new Error('Internship not found');
  }

  // Check if user already applied for this internship
  const existingApplication = await prisma.application.findFirst({
    where: {
      internshipId,
      applicantId: req.user.id,
    },
  });

  if (existingApplication) {
    res.status(400);
    throw new Error('You have already applied for this internship');
  }

  // Check if internship is still accepting applications
  const now = new Date();
  if (internship.startDate < now) {
    res.status(400);
    throw new Error('This internship has already started');
  }

  // Create application
  const application = await prisma.application.create({
    data: {
      internshipId,
      applicantId: req.user.id,
      ...applicationData,
    },
  });

  res.status(201).json(application);
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private/Admin, HR, Mentor
export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const applicationId = req.params.id;

  // Validate status
  const validStatuses = ['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid application status');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      internship: {
        select: {
          mentorId: true,
        },
      },
    },
  });

  if (application) {
    // Check if user has permission to update this application
    const hasPermission =
      req.user.role === 'ADMIN' ||
      req.user.role === 'HR' ||
      (application.internship?.mentorId === req.user.id);

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to update this application');
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewerId: req.user.id,
      },
    });

    res.json(updatedApplication);
  } else {
    res.status(404);
    throw new Error('Application not found');
  }
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin, HR, Intern (own applications)
export const deleteApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
  });

  if (application) {
    // Check if user has permission to delete this application
    const hasPermission =
      req.user.role === 'ADMIN' ||
      req.user.role === 'HR' ||
      (application.applicantId === req.user.id && application.status === 'PENDING');

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to delete this application');
    }

    await prisma.application.delete({
      where: { id: application.id },
    });
    res.json({ message: 'Application removed' });
  } else {
    res.status(404);
    throw new Error('Application not found');
  }
});

// @desc    Withdraw application (by applicant)
// @route   PUT /api/applications/:id/withdraw
// @access  Private/Intern
export const withdrawApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
  });

  if (application) {
    // Only the applicant can withdraw their application
    if (application.applicantId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to withdraw this application');
    }

    // Only pending applications can be withdrawn
    if (application.status !== 'PENDING') {
      res.status(400);
      throw new Error('Only pending applications can be withdrawn');
    }

    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'WITHDRAWN',
      },
    });

    res.json(updatedApplication);
  } else {
    res.status(404);
    throw new Error('Application not found');
  }
});