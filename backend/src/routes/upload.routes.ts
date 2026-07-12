import { Router } from 'express';
import { generateCloudinarySignature } from '../controllers/upload.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Only vendors and admins should be able to generate signatures for uploading files
router.post('/signature', authenticateJWT, authorizeRoles('vendor', 'super_admin'), generateCloudinarySignature);

export default router;
