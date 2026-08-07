import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  const diaries = await prisma.workDiary.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  res.json(diaries);
});

// @desc    Get all work diaries for review (Mentor/HR/Admin)
// @route   GET /api/work-diary
// @access  Private/Mentor/HR/Admin
export const getAllWorkDiaries = asyncHandler(async (req: Request, res: Response) => {
  const diaries = await prisma.workDiary.findMany({
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
    take: 100,
  });

  res.json(diaries);
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
