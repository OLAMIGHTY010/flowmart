import { Router } from 'express';
import { unifiedSearch } from '../controllers/search.controller';

const router = Router();

// Publicly accessible unified search
router.get('/', unifiedSearch);

export default router;
