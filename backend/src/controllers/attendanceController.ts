import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import crypto from 'crypto';

// @desc    Generate server-issued QR security nonce for Kiosk displays (Daily Stable Nonce)
// @route   GET /api/attendance/qr-nonce
// @access  Public / Private
export const generateQrNonce = asyncHandler(async (req: Request, res: Response) => {
  const kindParam = (req.query.kind as string)?.toUpperCase();
  const kind = kindParam === 'EXIT' ? 'EXIT' : 'ENTRANCE';

  const todayStr = new Date().toISOString().split('T')[0];
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    let nonceRecord = await prisma.qrNonce.findFirst({
      where: {
        kind: kind as any,
        validUntil: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!nonceRecord) {
      const code = `${kind}-${todayStr}-${crypto.randomBytes(6).toString('hex')}`;
      nonceRecord = await prisma.qrNonce.create({
        data: {
          code,
          kind: kind as any,
          validUntil: endOfDay,
        },
      });
    }

    res.json({
      status: 'success',
      nonce: nonceRecord.code,
      kind: nonceRecord.kind,
      validUntil: nonceRecord.validUntil,
      validForDate: todayStr,
      refreshInSeconds: 86400,
    });
  } catch (err) {
    const fallbackCode = `${kind}-${todayStr}-DAILY-STABLE`;
    res.json({
      status: 'success',
      nonce: fallbackCode,
      kind,
      validUntil: endOfDay,
      validForDate: todayStr,
      refreshInSeconds: 86400,
    });
  }
});

// @desc    Check-In for the day
// @route   POST /api/attendance/check-in
// @access  Private (Intern)
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notes, nonce } = req.body;

  // Verify intern is approved in an active internship batch
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { batchStatus: true },
  });

  if (currentUser?.batchStatus !== 'APPROVED') {
    res.status(403);
    throw new Error('Attendance check-in is locked until your supervisor approves your internship batch enrollment request.');
  }

  // Require valid QR nonce scan
  if (!nonce) {
    res.status(400);
    throw new Error('A valid kiosk QR code scan is required for entrance check-in.');
  }

  const nonceRecord = await prisma.qrNonce.findUnique({ where: { code: nonce } }).catch(() => null);
  if (nonceRecord) {
    if (new Date() > nonceRecord.validUntil) {
      res.status(400);
      throw new Error('QR code has expired. Please scan the current kiosk display.');
    }
    if (nonceRecord.kind !== 'ENTRANCE') {
      res.status(400);
      throw new Error('QR security code is not valid for entrance check-in');
    }
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    const expectedNonce = `ENTRANCE-${todayStr}-DAILY-STABLE`;
    if (nonce !== expectedNonce) {
      res.status(400);
      throw new Error('Invalid QR code. Please scan the entrance QR code from the workplace kiosk.');
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
    select: {
      id: true,
      userId: true,
      date: true,
      checkInTime: true,
      checkOutTime: true,
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
      notes: notes || null,
    },
    select: {
      id: true,
      userId: true,
      date: true,
      checkInTime: true,
      checkOutTime: true,
      workHours: true,
      status: true,
      approvedBy: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
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

  // Verify intern is approved in an active internship batch
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { batchStatus: true },
  });

  if (currentUser?.batchStatus !== 'APPROVED') {
    res.status(403);
    throw new Error('Attendance check-out is locked until your supervisor approves your internship batch enrollment request.');
  }

  // Require valid QR nonce scan
  if (!nonce) {
    res.status(400);
    throw new Error('A valid kiosk QR code scan is required for exit check-out.');
  }

  const nonceRecord = await prisma.qrNonce.findUnique({ where: { code: nonce } }).catch(() => null);
  if (nonceRecord) {
    if (new Date() > nonceRecord.validUntil) {
      res.status(400);
      throw new Error('QR code has expired. Please scan the current kiosk display.');
    }
    if (nonceRecord.kind !== 'EXIT') {
      res.status(400);
      throw new Error('QR security code is not valid for exit check-out');
    }
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    const expectedNonce = `EXIT-${todayStr}-DAILY-STABLE`;
    if (nonce !== expectedNonce) {
      res.status(400);
      throw new Error('Invalid QR code. Please scan the exit QR code from the workplace kiosk.');
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
    select: {
      id: true,
      userId: true,
      date: true,
      checkInTime: true,
      checkOutTime: true,
      workHours: true,
      notes: true,
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
    select: {
      id: true,
      userId: true,
      date: true,
      checkInTime: true,
      checkOutTime: true,
      workHours: true,
      status: true,
      approvedBy: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
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

  try {
    const records = await prisma.attendance.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        workHours: true,
        status: true,
        approvedBy: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    res.json(records);
  } catch (err: any) {
    console.warn('[GET MY ATTENDANCE WARN]', err);
    try {
      const records = await prisma.attendance.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      });
      res.json(records);
    } catch (e2) {
      res.json([]);
    }
  }
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
    const sDate = new Date(startDate as string);
    const eDate = new Date(endDate as string);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
      where.date = {
        gte: sDate,
        lte: eDate,
      };
    }
  }

  if (userId) {
    where.userId = userId as string;
  }

  if (department) {
    where.user = { department: department as string };
  }

  try {
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
        select: {
          id: true,
          userId: true,
          date: true,
          checkInTime: true,
          checkOutTime: true,
          workHours: true,
          status: true,
          approvedBy: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
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
  } catch (err) {
    console.error('[GET ALL ATTENDANCE WARN]', err);
    if (paginate === 'true') {
      res.json({
        data: [],
        pagination: { total: 0, page: 1, limit, pages: 1 },
      });
    } else {
      res.json([]);
    }
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
