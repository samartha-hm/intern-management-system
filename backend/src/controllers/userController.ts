import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import { protect, authorize } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      position: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      position: true,
      phone: true,
      contractDays: true,
      batchStatus: true,
      assignedBatchId: true,
      assignedBatch: {
        select: {
          id: true,
          title: true,
          department: true,
          startDate: true,
          endDate: true,
        },
      },
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create new user with custom role
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role, department, position, contractDays } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error('Please provide email, password, firstName, and lastName');
  }

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const targetRole = role === 'ADMIN' ? 'ADMIN' : role === 'MENTOR' ? 'MENTOR' : 'INTERN';

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: targetRole,
      department: department || 'General',
      position: position || (targetRole === 'MENTOR' ? 'Mentor' : targetRole === 'ADMIN' ? 'System Administrator' : 'Software Engineering Intern'),
      contractDays: Number(contractDays) || 65,
      batchStatus: targetRole === 'INTERN' ? 'NONE' : 'APPROVED',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      position: true,
      contractDays: true,
      batchStatus: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json(user);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.department = req.body.department || user.department;
    user.position = req.body.position || user.position;
    user.phone = req.body.phone || user.phone;
    user.contractDays = req.body.contractDays !== undefined ? Number(req.body.contractDays) : user.contractDays;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        contractDays: user.contractDays,
        isActive: user.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        contractDays: true,
        isActive: true,
      },
    });

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (user) {
    await prisma.user.delete({
      where: { id: user.id },
    });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user password (admin only)
// @route   PUT /api/users/:id/password
// @access  Private/Admin
export const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Intern request to join a batch
// @route   POST /api/users/request-batch
// @access  Private (Intern)
export const requestBatch = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { batchId } = req.body;

  if (!batchId) {
    res.status(400);
    throw new Error('Batch ID is required');
  }

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.batchStatus === 'APPROVED') {
    res.status(400);
    throw new Error('You are already enrolled and approved in an active internship batch.');
  }

  const batch = await prisma.internship.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    res.status(404);
    throw new Error('Internship batch not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      assignedBatchId: batchId,
      batchStatus: 'REQUESTED',
      department: batch.department,
    },
  });

  res.json({ message: 'Batch join request submitted successfully', user: updatedUser });
});

// @desc    Cancel intern batch request
// @route   POST /api/users/cancel-batch-request
// @access  Private (Intern)
export const cancelBatchRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      assignedBatchId: null,
      batchStatus: 'NONE',
    },
  });

  res.json({ message: 'Batch join request cancelled', user: updatedUser });
});

// @desc    Get all pending intern batch requests (Admin/Mentor)
// @route   GET /api/users/batch-requests
// @access  Private/Admin/Mentor
export const getBatchRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.user.findMany({
    where: {
      batchStatus: 'REQUESTED',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      department: true,
      contractDays: true,
      batchStatus: true,
      assignedBatchId: true,
      assignedBatch: {
        select: {
          id: true,
          title: true,
          department: true,
          startDate: true,
          endDate: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(requests);
});

// @desc    Approve or Reject intern batch request (Admin/Mentor)
// @route   PUT /api/users/:id/batch-status
// @access  Private/Admin/Mentor
export const updateBatchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, contractDays, batchId, assignedBatchId } = req.body; // 'APPROVED' or 'REJECTED'

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let targetBatchId = batchId || assignedBatchId || user.assignedBatchId;

  // Fallback: If no batch ID is linked yet, pick the latest active internship batch
  if (!targetBatchId && status === 'APPROVED') {
    const defaultBatch = await prisma.internship.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (defaultBatch) {
      targetBatchId = defaultBatch.id;
    }
  }

  const dataToUpdate: any = {
    batchStatus: status,
  };

  if (targetBatchId && status === 'APPROVED') {
    dataToUpdate.assignedBatchId = targetBatchId;
  }

  if (contractDays && typeof contractDays === 'number') {
    dataToUpdate.contractDays = contractDays;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });

  if (status === 'APPROVED' && targetBatchId) {
    await prisma.internship.update({
      where: { id: targetBatchId },
      data: {
        interns: { connect: { id } },
        assignedInterns: { connect: { id } },
      },
    }).catch(() => {});
  }

  res.json(updated);
});

// @desc    Update student custom contract days and assigned batch (Admin/Mentor)
// @route   PUT /api/users/:id/contract
// @access  Private/Admin/Mentor
export const updateUserContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { contractDays, assignedBatchId, department, position } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const dataToUpdate: any = {};

  if (contractDays !== undefined) dataToUpdate.contractDays = Number(contractDays);
  if (assignedBatchId !== undefined) {
    dataToUpdate.assignedBatchId = assignedBatchId;
    dataToUpdate.batchStatus = 'APPROVED';
  }
  if (department !== undefined) dataToUpdate.department = department;
  if (position !== undefined) dataToUpdate.position = position;

  const updated = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });

  res.json(updated);
});

export { protect, authorize };