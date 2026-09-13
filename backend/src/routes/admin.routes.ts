import { Router } from 'express';
import {
  getQuestions,
  createQuestion,
  deleteQuestion,
  bulkImportQuestions,
  updateExamPattern,
  getSystemStats,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/bulk', bulkImportQuestions);
router.put('/patterns/:patternId', updateExamPattern);
router.get('/stats', getSystemStats);

export default router;
