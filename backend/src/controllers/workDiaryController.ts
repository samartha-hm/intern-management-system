import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';

// @desc    Submit or update daily work diary
// @route   POST /api/work-diary
// @access  Private (Intern)
export const submitWorkDiary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { tasksDone, hoursSpent, blockers, learnings } = req.body;

  if (!tasksDone || !hoursSpent) {
    res.status(400);
    throw new Error('Tasks done and hours spent are required');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const existingEntry = await prisma.workDiary.findFirst({
    where: {
      userId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (existingEntry) {
    const updated = await prisma.workDiary.update({
      where: { id: existingEntry.id },
      data: {
        tasksDone,
        hoursSpent: parseFloat(hoursSpent),
        blockers,
        learnings,
        status: 'SUBMITTED',
      },
    });
    res.json(updated);
  } else {
    const created = await prisma.workDiary.create({
      data: {
        userId,
        tasksDone,
        hoursSpent: parseFloat(hoursSpent),
        blockers,
        learnings,
        status: 'SUBMITTED',
      },
    });
    res.status(201).json(created);
  }
});

// @desc    Get my work diary entries
// @route   GET /api/work-diary/my
// @access  Private (Intern)
export const getMyWorkDiaries = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const diaries = await prisma.workDiary.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    skip,
    take: limit,
  });

  res.json(diaries);
});

// @desc    Get all work diaries for review (Mentor/HR/Admin)
// @route   GET /api/work-diary
// @access  Private/Mentor/HR/Admin
export const getAllWorkDiaries = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const { startDate, endDate, userId, department } = req.query;

  const where: any = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  if (userId) {
    where.userId = userId as string;
  }

  if (department) {
    where.user = { department: department as string };
  }

  // Mentor scoping: mentors can only view work diaries for their assigned mentees
  if (req.user!.role === 'MENTOR') {
    where.user = {
      ...where.user,
      assignedBatch: {
        mentorId: req.user!.id,
      },
    };
  }

  const [diaries, total] = await Promise.all([
    prisma.workDiary.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.workDiary.count({ where }),
  ]);

  res.json({
    data: diaries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Review & approve work diary entry
// @route   PUT /api/work-diary/:id/review
// @access  Private/Mentor/HR/Admin
export const reviewWorkDiary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { feedback, status } = req.body;

  const diary = await prisma.workDiary.findUnique({
    where: { id },
  });

  if (!diary) {
    res.status(404);
    throw new Error('Work diary entry not found');
  }

  const updated = await prisma.workDiary.update({
    where: { id },
    data: {
      feedback,
      status: status || 'APPROVED',
      reviewedBy: req.user!.id,
    },
  });

  res.json(updated);
});
