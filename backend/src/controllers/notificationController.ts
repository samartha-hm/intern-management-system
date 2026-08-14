import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import { protect, authorize } from '../middleware/authMiddleware';

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: req.user.id,
      },
      include: {
        sender: {
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

    res.json(notifications || []);
  } catch (err: any) {
    console.error('getNotifications error fallback:', err?.message || err);
    res.json([]);
  }
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (notification) {
    // Check if the notification belongs to the current user
    if (notification.recipientId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to view this notification');
    }

    res.json(notification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (notification) {
    // Check if the notification belongs to the current user
    if (notification.recipientId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this notification');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
      },
    });

    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: {
      recipientId: req.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (notification) {
    // Check if the notification belongs to the current user
    if (notification.recipientId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to delete this notification');
    }

    await prisma.notification.delete({
      where: { id: notification.id },
    });
    res.json({ message: 'Notification removed' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, senderId, type, title, message, relatedEntityId, relatedEntityType } = req.body;

  // Validate recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
  });

  if (!recipient) {
    res.status(400);
    throw new Error('Recipient not found');
  }

  // Validate sender if provided
  if (senderId) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      res.status(400);
      throw new Error('Sender not found');
    }
  }

  // Check permissions
  let hasPermission = false;

  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    // Admin and HR can create notifications for any user
    hasPermission = true;
  } else if (req.user.role === 'MENTOR') {
    // Mentors can create notifications for interns they mentor
    const internship = await prisma.internship.findFirst({
      where: {
        mentorId: req.user.id,
        interns: {
          some: {
            id: recipientId,
          },
        },
      },
    });

    if (internship) {
      hasPermission = true;
    }
  } else {
    // Users can only create notifications for themselves
    if (recipientId === req.user.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to create notification for this recipient');
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId,
      senderId: senderId || null,
      type,
      title,
      message,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
    },
  });

  res.status(201).json(notification);
});