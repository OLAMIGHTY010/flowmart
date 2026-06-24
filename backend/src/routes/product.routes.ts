import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getVendorPublicProfile, getCategories } from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProductById); 
router.post('/', authenticateJWT, authorizeRoles('vendor', 'super_admin'), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), deleteProduct);

export default router;