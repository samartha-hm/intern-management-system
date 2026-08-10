import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';

// @desc    Submit or update daily work diary
// @route   POST /api/work-diary
// @access  Private (Intern)
export const submitWorkDiary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { tasksDone, hoursSpent, blockers, learnings } = req.body;

  if (!tasksDone) {
    res.status(400);
    throw new Error('Work accomplishment summary is required');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Auto-calculate work hours from today's attendance check-in & check-out logs
  const todayAtt = await prisma.attendance.findFirst({
    where: {
      userId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  let computedHours = hoursSpent ? parseFloat(hoursSpent) : 0;
  if (todayAtt?.workHours && todayAtt.workHours > 0) {
    computedHours = todayAtt.workHours;
  } else if (todayAtt?.checkInTime) {
    const checkOutMs = todayAtt.checkOutTime ? new Date(todayAtt.checkOutTime).getTime() : new Date().getTime();
    const diffMs = checkOutMs - new Date(todayAtt.checkInTime).getTime();
    computedHours = Math.round((Math.max(0, diffMs) / (1000 * 60 * 60)) * 100) / 100;
  }

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
        hoursSpent: computedHours,
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
        hoursSpent: computedHours,
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

  const attendanceRecords = await prisma.attendance.findMany({
    where: { userId },
  });

  const enrichedDiaries = diaries.map((d) => {
    const dDateStr = new Date(d.date).toISOString().split('T')[0];
    const matchedAtt = attendanceRecords.find((a) => {
      const aDateStr = new Date(a.date || a.checkInTime).toISOString().split('T')[0];
      return aDateStr === dDateStr;
    });

    let finalHours = d.hoursSpent;
    if (matchedAtt?.workHours && matchedAtt.workHours > 0) {
      finalHours = matchedAtt.workHours;
    } else if (matchedAtt?.checkInTime && matchedAtt?.checkOutTime) {
      const diffMs = new Date(matchedAtt.checkOutTime).getTime() - new Date(matchedAtt.checkInTime).getTime();
      const actualHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      if (actualHours >= 0.1) {
        finalHours = actualHours;
      }
    }

    return {
      ...d,
      hoursSpent: finalHours,
      checkInTime: matchedAtt?.checkInTime ? new Date(matchedAtt.checkInTime).toISOString() : null,
      checkOutTime: matchedAtt?.checkOutTime ? new Date(matchedAtt.checkOutTime).toISOString() : null,
    };
  });

  res.json(enrichedDiaries);
});

// @desc    Get all work diaries for review (Mentor/HR/Admin)
// @route   GET /api/work-diary
// @access  Private/Mentor/HR/Admin
export const getAllWorkDiaries = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const { startDate, endDate, userId, department, paginate } = req.query;

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
    const mentees = await prisma.user.findMany({
      where: {
        role: 'INTERN',
        OR: [
          { assignedBatch: { mentorId: req.user!.id } },
          { internships: { some: { mentorId: req.user!.id } } },
        ],
      },
      select: { id: true },
    });
    const menteeIds = mentees.map((m) => m.id);
    where.userId = { in: menteeIds };
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

  const userIds = Array.from(new Set(diaries.map((d) => d.userId)));
  const attendanceRecords = await prisma.attendance.findMany({
    where: { userId: { in: userIds } },
  });

  const enrichedDiaries = diaries.map((d) => {
    const dDateStr = new Date(d.date).toISOString().split('T')[0];
    const matchedAtt = attendanceRecords.find((a) => {
      const aDateStr = new Date(a.date || a.checkInTime).toISOString().split('T')[0];
      return a.userId === d.userId && aDateStr === dDateStr;
    });

    let finalHours = d.hoursSpent;
    if (matchedAtt?.workHours && matchedAtt.workHours > 0) {
      finalHours = matchedAtt.workHours;
    } else if (matchedAtt?.checkInTime && matchedAtt?.checkOutTime) {
      const diffMs = new Date(matchedAtt.checkOutTime).getTime() - new Date(matchedAtt.checkInTime).getTime();
      const actualHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      if (actualHours >= 0.1) {
        finalHours = actualHours;
      }
    }

    return {
      ...d,
      hoursSpent: finalHours,
      checkInTime: matchedAtt?.checkInTime ? new Date(matchedAtt.checkInTime).toISOString() : null,
      checkOutTime: matchedAtt?.checkOutTime ? new Date(matchedAtt.checkOutTime).toISOString() : null,
    };
  });

  if (paginate === 'true') {
    res.json({
      data: enrichedDiaries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } else {
    res.json(enrichedDiaries);
  }
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
