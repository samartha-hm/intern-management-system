import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByUser,
} from '../controllers/taskController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all tasks
router.route('/')
  .get(getTasks)
  // Create task
  .post(createTask);

// Get specific task
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Get tasks by project
router.route('/project/:projectId')
  .get(getTasksByProject);

// Get tasks by user
router.route('/user/:userId')
  .get(getTasksByUser);

export default router;