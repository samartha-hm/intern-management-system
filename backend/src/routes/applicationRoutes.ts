import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  withdrawApplication,
} from '../controllers/applicationController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all applications
router.route('/')
  .get(getApplications)
  // Create application (Intern only)
  .post(authorize('INTERN'), createApplication);

// Get specific application
router.route('/:id')
  .get(getApplicationById)
  // Update application status (Admin/HR/Mentor)
  .put(authorize('ADMIN', 'HR', 'MENTOR'), updateApplicationStatus)
  // Delete application (Admin/HR or owner if pending)
  .delete(deleteApplication);

// Withdraw application (Intern only)
router.route('/:id/withdraw')
  .put(authorize('INTERN'), withdrawApplication);

export default router;