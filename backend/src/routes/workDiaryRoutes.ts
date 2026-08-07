import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  submitWorkDiary,
  getMyWorkDiaries,
  getAllWorkDiaries,
  reviewWorkDiary,
} from '../controllers/workDiaryController';

const router = express.Router();

router.post('/', protect, submitWorkDiary);
router.get('/my', protect, getMyWorkDiaries);
router.get('/', protect, authorize('MENTOR', 'HR', 'ADMIN'), getAllWorkDiaries);
router.put('/:id/review', protect, authorize('MENTOR', 'HR', 'ADMIN'), reviewWorkDiary);

export default router;
