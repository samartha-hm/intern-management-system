import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  assignInternToInternship,
  removeInternFromInternship,
  addInternToBatch,
} from '../controllers/internshipController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all internships (accessible to all authenticated users)
router.route('/')
  .get(getInternships)
  // Create internship (Admin/HR/Mentor)
  .post(authorize('ADMIN', 'HR', 'MENTOR'), createInternship);

// Get specific internship
router.route('/:id')
  .get(getInternshipById)
  // Update internship (Admin/HR/Mentor)
  .put(authorize('ADMIN', 'HR', 'MENTOR'), updateInternship)
  // Delete internship (Admin/HR/Mentor)
  .delete(authorize('ADMIN', 'HR', 'MENTOR'), deleteInternship);

// Assign intern to internship
router.route('/:id/interns')
  .post(authorize('ADMIN', 'HR', 'MENTOR'), assignInternToInternship);

// Assign intern to batch
router.route('/:id/assign-intern')
  .post(authorize('ADMIN', 'HR', 'MENTOR'), addInternToBatch);

// Remove intern from internship
router.route('/:id/interns/:internId')
  .delete(authorize('ADMIN', 'HR', 'MENTOR'), removeInternFromInternship);

export default router;