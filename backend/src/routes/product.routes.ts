import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getVendorPublicProfile, getCategories } from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', authenticateJWT, getCategories);
router.get('/', authenticateJWT, getProducts);
router.get('/:id', authenticateJWT, getProductById); 
router.post('/', authenticateJWT, authorizeRoles('vendor', 'super_admin'), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), deleteProduct);

export default router;