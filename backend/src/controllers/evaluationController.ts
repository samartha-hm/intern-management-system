import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { protect, authorize } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// @desc    Get all evaluations
// @route   GET /api/evaluations
// @access  Private
export const getEvaluations = asyncHandler(async (req: Request, res: Response) => {
  // Build where clause based on user role
  let whereClause: any = {};

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see all evaluations
    whereClause = {};
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see evaluations they gave
    whereClause = {
      evaluatorId: req.user.id,
    };
  } else {
    // Interns can only see evaluations they received
    whereClause = {
      internId: req.user.id,
    };
  }

  const evaluations = await prisma.evaluation.findMany({
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
      evaluator: {
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(evaluations);
});

// @desc    Get evaluation by ID
// @route   GET /api/evaluations/:id
// @access  Private
export const getEvaluationById = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await prisma.evaluation.findUnique({
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
      evaluator: {
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
  });

  if (evaluation) {
    // Check if user has permission to view this evaluation
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      hasPermission = true;
    } else if (req.user.role === 'MENTOR') {
      // Mentor can see if they are the evaluator
      if (evaluation.evaluatorId === req.user.id) {
        hasPermission = true;
      }
    } else {
      // Intern can see if they are the intern being evaluated
      if (evaluation.internId === req.user.id) {
        hasPermission = true;
      }
    }

    if (hasPermission) {
      res.json(evaluation);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this evaluation');
    }
  } else {
    res.status(404);
    throw new Error('Evaluation not found');
  }
});

// @desc    Create evaluation
// @route   POST /api/evaluations
// @access  Private/Mentor, Admin, HR
export const createEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const { internId, internshipId, periodStart, periodEnd, scores, feedback, strengths, areasForImprovement, goalsNextPeriod, overallRating } = req.body;

  // Validate intern exists
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
    throw new Error('Not authorized to create evaluation for this intern');
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

  const evaluation = await prisma.evaluation.create({
    data: {
      internId,
      evaluatorId: req.user.id,
      internshipId: internshipId || undefined,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      scores: scores || {},
      feedback: feedback || '',
      strengths: strengths || '',
      areasForImprovement: areasForImprovement || '',
      goalsNextPeriod: goalsNextPeriod || '',
      overallRating: overallRating || 0,
    },
  });

  res.status(201).json(evaluation);
});

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private/Mentor, Admin, HR (only evaluator can update)
export const updateEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: req.params.id },
  });

  if (evaluation) {
    // Only the evaluator can update the evaluation
    if (evaluation.evaluatorId !== req.user.id) {
      // Admin and HR can also update
      if (!(req.user.role === 'ADMIN' || req.user.role === 'HR')) {
        res.status(403);
        throw new Error('Not authorized to update this evaluation');
      }
    }

    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        periodStart: req.body.periodStart ? new Date(req.body.periodStart) : evaluation.periodStart,
        periodEnd: req.body.periodEnd ? new Date(req.body.periodEnd) : evaluation.periodEnd,
        scores: req.body.scores || evaluation.scores,
        feedback: req.body.feedback || evaluation.feedback,
        strengths: req.body.strengths || evaluation.strengths,
        areasForImprovement: req.body.areasForImprovement || evaluation.areasForImprovement,
        goalsNextPeriod: req.body.goalsNextPeriod || evaluation.goalsNextPeriod,
        overallRating: req.body.overallRating !== undefined ? req.body.overallRating : evaluation.overallRating,
      },
    });

    res.json(updatedEvaluation);
  } else {
    res.status(404);
    throw new Error('Evaluation not found');
  }
});

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private/Admin, HR, Evaluator
export const deleteEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: req.params.id },
  });

  if (evaluation) {
    // Check permissions
    let hasPermission = false;

    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      // Admin and HR can delete any evaluation
      hasPermission = true;
    } else if (evaluation.evaluatorId === req.user.id) {
      // Evaluator can delete their own evaluations
      hasPermission = true;
    }

    if (!hasPermission) {
      res.status(403);
      throw new Error('Not authorized to delete this evaluation');
    }

    await prisma.evaluation.delete({
      where: { id: evaluation.id },
    });
    res.json({ message: 'Evaluation removed' });
  } else {
    res.status(404);
    throw new Error('Evaluation not found');
  }
});

// @desc    Get evaluations for a specific intern
// @route   GET /api/evaluations/intern/:internId
// @access  Private
export const getEvaluationsByIntern = asyncHandler(async (req: Request, res: Response) => {
  const { internId } = req.params;

  // Check if intern exists
  const intern = await prisma.user.findUnique({
    where: { id: internId },
  });

  if (!intern) {
    res.status(404);
    throw new Error('Intern not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see evaluations for any intern
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see evaluations for interns they mentor
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
      hasPermission = true;
    }
  } else {
    // Interns can only see their own evaluations
    if (internId === req.user.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view evaluations for this intern');
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { internId },
    include: {
      evaluator: {
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(evaluations);
});

// @desc    Get evaluations for a specific internship
// @route   GET /api/evaluations/internship/:internshipId
// @access  Private
export const getEvaluationsByInternship = asyncHandler(async (req: Request, res: Response) => {
  const { internshipId } = req.params;

  // Check if internship exists
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
  });

  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can see evaluations for any internship
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can see evaluations for internships they mentor
    if (internship.mentorId === req.user.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view evaluations for this internship');
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { internshipId },
    include: {
      intern: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      evaluator: {
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

  res.json(evaluations);
});