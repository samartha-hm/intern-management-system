import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  verifyAttendance,
} from '../controllers/attendanceController';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my', protect, getMyAttendance);
router.get('/', protect, authorize('MENTOR', 'HR', 'ADMIN'), getAllAttendance);
router.put('/:id/verify', protect, authorize('MENTOR', 'HR', 'ADMIN'), verifyAttendance);

export default router;

