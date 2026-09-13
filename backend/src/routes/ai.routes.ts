import { Router } from 'express';
import {
  explainQuestion,
  answerDoubt,
  analyzeMistakes,
  generateStudyPlan,
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/explain/:questionId', explainQuestion);
router.post('/doubt', answerDoubt);
router.get('/analyze-mistakes', analyzeMistakes);
router.get('/study-plan', generateStudyPlan);

export default router;
