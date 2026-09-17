import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/category.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticateJWT, createCategory);

export default router;
