import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all projects
router.route('/')
  .get(getProjects)
  // Create project (Mentor/Admin/HR)
  .post(authorize('MENTOR', 'ADMIN', 'HR'), createProject);

// Get specific project
router.route('/:id')
  .get(getProjectById)
  // Update project (Mentor/Admin/HR)
  .put(authorize('MENTOR', 'ADMIN', 'HR'), updateProject)
  // Delete project (Mentor/Admin/HR)
  .delete(authorize('MENTOR', 'ADMIN', 'HR'), deleteProject);

export default router;