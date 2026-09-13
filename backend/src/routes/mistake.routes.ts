import { Router } from 'express';
import { getMistakes, updateMistake, deleteMistake } from '../controllers/mistake.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMistakes);
router.put('/:id', updateMistake);
router.delete('/:id', deleteMistake);

export default router;
