import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from '../controllers/notificationController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all notifications
router.route('/')
  .get(getNotifications)
  // Create notification
  .post(createNotification);

// Get current user's notifications
router.get('/my', getNotifications);

// Get specific notification
router.route('/:id')
  .get(getNotificationById)
  .put(markNotificationAsRead)
  .delete(deleteNotification);

// Mark all notifications as read
router.route('/read-all')
  .put(markAllNotificationsAsRead);

export default router;