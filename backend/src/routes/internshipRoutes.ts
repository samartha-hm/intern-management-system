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
} from '../controllers/internshipController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all internships (accessible to all authenticated users)
router.route('/')
  .get(getInternships)
  // Create internship (Admin/HR only)
  .post(authorize('ADMIN', 'HR'), createInternship);

// Get specific internship
router.route('/:id')
  .get(getInternshipById)
  // Update internship (Admin/HR only)
  .put(authorize('ADMIN', 'HR'), updateInternship)
  // Delete internship (Admin/HR only)
  .delete(authorize('ADMIN', 'HR'), deleteInternship);

// Assign intern to internship (Admin/HR/Mentor only)
router.route('/:id/interns')
  .post(authorize('ADMIN', 'HR', 'MENTOR'), assignInternToInternship);

// Remove intern from internship (Admin/HR/Mentor only)
router.route('/:id/interns/:internId')
  .delete(authorize('ADMIN', 'HR', 'MENTOR'), removeInternFromInternship);

export default router;