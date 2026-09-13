import { Router } from 'express';
import {
  startSession,
  getSessionState,
  submitAnswer,
  updateStatus,
  submitTest,
  getPostExamAnalysis,
} from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/start', startSession);
router.get('/:id/state', getSessionState);
router.post('/:id/answer', submitAnswer);
router.post('/:id/status', updateStatus);
router.post('/:id/submit', submitTest);
router.get('/:id/analysis', getPostExamAnalysis);

export default router;
