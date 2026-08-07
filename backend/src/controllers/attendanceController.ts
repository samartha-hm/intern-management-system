import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Check-In for the day
// @route   POST /api/attendance/check-in
// @access  Private (Intern)
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notes } = req.body;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Check if already checked in today
  const existingRecord = await prisma.attendance.findFirst({
    where: {
      userId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (existingRecord) {
    res.status(400);
    throw new Error('You have already checked in for today');
  }

  const now = new Date();
  // Standard check-in time threshold (e.g., 9:30 AM is LATE)
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
  const status = isLate ? 'LATE' : 'PRESENT';

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      checkInTime: now,
      status,
      notes,
    },
  });

  res.status(201).json(attendance);
});

// @desc    Check-Out for the day
// @route   POST /api/attendance/check-out
// @access  Private (Intern)
export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (!attendance) {
    res.status(400);
    throw new Error('No check-in record found for today');
  }

  if (attendance.checkOutTime) {
    res.status(400);
    throw new Error('You have already checked out for today');
  }

  const now = new Date();
  const diffMs = now.getTime() - new Date(attendance.checkInTime).getTime();
  const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: now,
      workHours,
    },
  });

  res.json(updatedAttendance);
});

// @desc    Get attendance records for current user
// @route   GET /api/attendance/my
// @access  Private
export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const records = await prisma.attendance.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 31,
  });

  res.json(records);
});

// @desc    Get all attendance records (Mentor/HR/Admin)
// @route   GET /api/attendance
// @access  Private/Mentor/HR/Admin
export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
  const records = await prisma.attendance.findMany({
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

  res.json(records);
});
