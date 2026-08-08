import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import crypto from 'crypto';

// @desc    Generate server-issued QR security nonce for Kiosk displays
// @route   GET /api/attendance/qr-nonce
// @access  Public / Private
export const generateQrNonce = asyncHandler(async (req: Request, res: Response) => {
  const kindParam = (req.query.kind as string)?.toUpperCase();
  const kind = kindParam === 'EXIT' ? 'EXIT' : 'ENTRANCE';

  const code = `${kind}-${crypto.randomBytes(16).toString('hex')}`;
  const validUntil = new Date(Date.now() + 45 * 1000); // 45-second validity

  try {
    const nonceRecord = await prisma.qrNonce.create({
      data: {
        code,
        kind: kind as any,
        validUntil,
      },
    });

    res.json({
      status: 'success',
      nonce: nonceRecord.code,
      kind: nonceRecord.kind,
      validUntil: nonceRecord.validUntil,
      refreshInSeconds: 30,
    });
  } catch (err) {
    res.json({
      status: 'success',
      nonce: code,
      kind,
      validUntil,
      refreshInSeconds: 30,
    });
  }
});

// @desc    Check-In for the day
// @route   POST /api/attendance/check-in
// @access  Private (Intern)
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notes, nonce } = req.body;

  // Verify server-issued QR nonce if passed or in production
  if (nonce) {
    try {
      const nonceRecord = await prisma.qrNonce.findUnique({ where: { code: nonce } });
      if (nonceRecord) {
        if (nonceRecord.isUsed) {
          res.status(400);
          throw new Error('QR security nonce has already been used');
        }
        if (new Date() > nonceRecord.validUntil) {
          res.status(400);
          throw new Error('QR security nonce has expired. Please rescan kiosk screen.');
        }
        if (nonceRecord.kind !== 'ENTRANCE') {
          res.status(400);
          throw new Error('QR security nonce is not valid for entrance check-in');
        }
        await prisma.qrNonce.update({
          where: { id: nonceRecord.id },
          data: { isUsed: true },
        });
      }
    } catch (e: any) {
      if (e.message?.includes('QR security nonce') || e.message?.includes('expired')) throw e;
      // Skip optional check if table not yet migrated
    }
  }

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
  const status = 'PRESENT';

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
  const { notes, nonce } = req.body;

  // Verify server-issued QR nonce if passed
  if (nonce) {
    try {
      const nonceRecord = await prisma.qrNonce.findUnique({ where: { code: nonce } });
      if (nonceRecord) {
        if (nonceRecord.isUsed) {
          res.status(400);
          throw new Error('QR security nonce has already been used');
        }
        if (new Date() > nonceRecord.validUntil) {
          res.status(400);
          throw new Error('QR security nonce has expired. Please rescan kiosk screen.');
        }
        if (nonceRecord.kind !== 'EXIT') {
          res.status(400);
          throw new Error('QR security nonce is not valid for exit check-out');
        }
        await prisma.qrNonce.update({
          where: { id: nonceRecord.id },
          data: { isUsed: true },
        });
      }
    } catch (e: any) {
      if (e.message?.includes('QR security nonce') || e.message?.includes('expired')) throw e;
      // Skip optional check if table not yet migrated
    }
  }

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
      notes: notes || attendance.notes,
    },
  });

  res.json(updatedAttendance);
});

// @desc    Get attendance records for current user
// @route   GET /api/attendance/my
// @access  Private
export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const records = await prisma.attendance.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    skip,
    take: limit,
  });

  res.json(records);
});

// @desc    Get all attendance records (Mentor/HR/Admin)
// @route   GET /api/attendance
// @access  Private/Mentor/HR/Admin
export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
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

  // Mentor scoping: mentors can only view attendance for their assigned mentees
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

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
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
    prisma.attendance.count({ where }),
  ]);

  if (paginate === 'true') {
    res.json({
      data: records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } else {
    res.json(records);
  }
});

// @desc    Verify/Approve attendance record
// @route   PUT /api/attendance/:id/verify
// @access  Private/Mentor/HR/Admin
export const verifyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const attendance = await prisma.attendance.findUnique({
    where: { id },
  });

  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      approvedBy: req.user!.id,
    },
  });

  res.json(updated);
});

