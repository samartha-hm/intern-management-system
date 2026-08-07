import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationsByIntern,
  getEvaluationsByInternship,
} from '../controllers/evaluationController';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all evaluations
router.route('/')
  .get(getEvaluations)
  // Create evaluation (Mentor/Admin/HR)
  .post(authorize('MENTOR', 'ADMIN', 'HR'), createEvaluation);

// Get specific evaluation
router.route('/:id')
  .get(getEvaluationById)
  // Update evaluation (Evaluator/Admin/HR)
  .put(updateEvaluation)
  // Delete evaluation (Evaluator/Admin/HR)
  .delete(deleteEvaluation);

// Get evaluations by intern
router.route('/intern/:internId')
  .get(getEvaluationsByIntern);

// Get evaluations by internship
router.route('/internship/:internshipId')
  .get(getEvaluationsByInternship);

export default router;