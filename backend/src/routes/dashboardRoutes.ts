import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboardController';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);

export default router;
