import { Router } from 'express';
import { getDueRevisions, submitReview } from '../controllers/revision.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/due', getDueRevisions);
router.post('/review', submitReview);

export default router;
