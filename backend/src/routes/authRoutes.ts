import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validationMiddleware';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: { status: 'error', message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;