import { Router } from 'express';
import { getBookmarks, createBookmark, deleteBookmark } from '../controllers/bookmark.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getBookmarks);
router.post('/', createBookmark);
router.delete('/:id', deleteBookmark);

export default router;
