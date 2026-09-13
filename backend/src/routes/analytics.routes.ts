import { Router } from 'express';
import { getDashboardSummary } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardSummary);

export default router;
