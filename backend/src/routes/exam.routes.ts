import { Router } from 'express';
import { getExams, getExamDetails } from '../controllers/exam.controller.js';

const router = Router();

router.get('/', getExams);
router.get('/:id', getExamDetails);

export default router;
