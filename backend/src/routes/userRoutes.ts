import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPassword,
} from '../controllers/userController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.use(authorize('ADMIN'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/password')
  .put(updateUserPassword);

export default router;