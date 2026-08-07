import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  uploadDocument,
  getDocumentsByEntity,
  getDocumentById,
  deleteDocument,
  downloadDocument,
} from '../controllers/documentController';

const router = express.Router();

router.post('/upload', protect, uploadDocument);
router.get('/entity/:entityId/:entityType', protect, getDocumentsByEntity);
router.get('/download/:id', protect, downloadDocument);

router.route('/:id')
  .get(protect, getDocumentById)
  .delete(protect, deleteDocument);

export default router;
