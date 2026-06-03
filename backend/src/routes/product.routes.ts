import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Everyone logged in (including attendees) can browse available products
router.get('/', authenticateJWT, getProducts);

// Only vendors (and super admins) can manage inventory
router.post('/', authenticateJWT, authorizeRoles('vendor', 'super_admin'), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), deleteProduct);

export default router;
