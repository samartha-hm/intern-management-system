import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} from '../controllers/attendanceController';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my', protect, getMyAttendance);
router.get('/', protect, authorize('MENTOR', 'HR', 'ADMIN'), getAllAttendance);

export default router;
