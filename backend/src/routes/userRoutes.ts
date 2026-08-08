import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  requestBatch,
  cancelBatchRequest,
  getBatchRequests,
  updateBatchStatus,
  updateUserContract,
} from '../controllers/userController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Intern batch request
router.post('/request-batch', requestBatch);
router.post('/cancel-batch-request', cancelBatchRequest);

// Supervisor / Admin routes (ADMIN, MENTOR)
router.get('/batch-requests', authorize('ADMIN', 'MENTOR', 'HR'), getBatchRequests);
router.put('/:id/batch-status', authorize('ADMIN', 'MENTOR', 'HR'), updateBatchStatus);
router.put('/:id/contract', authorize('ADMIN', 'MENTOR', 'HR'), updateUserContract);

// User management routes (ADMIN, MENTOR, HR)
router.use(authorize('ADMIN', 'MENTOR', 'HR'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/password')
  .put(updateUserPassword);

export default router;