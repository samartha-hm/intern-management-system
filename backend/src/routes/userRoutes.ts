import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPassword,
  requestBatch,
  getBatchRequests,
  updateBatchStatus,
  updateUserContract,
} from '../controllers/userController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Intern batch request
router.post('/request-batch', requestBatch);

// Supervisor / Admin routes (ADMIN, MENTOR, HR)
router.get('/batch-requests', authorize('ADMIN', 'MENTOR', 'HR'), getBatchRequests);
router.put('/:id/batch-status', authorize('ADMIN', 'MENTOR', 'HR'), updateBatchStatus);
router.put('/:id/contract', authorize('ADMIN', 'MENTOR', 'HR'), updateUserContract);

// Admin only user management routes
router.use(authorize('ADMIN', 'HR'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/password')
  .put(updateUserPassword);

export default router;