import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { 
  getUsersStats, 
  getUsers, 
  createUser, 
  updateUserStatus,
  updateUserProfile
} from '../controllers/user-management.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateJWT);
router.use(authorizeRoles('super_admin', 'admin'));

router.get('/stats', getUsersStats);
router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);
router.put('/:id', updateUserProfile);

export default router;
