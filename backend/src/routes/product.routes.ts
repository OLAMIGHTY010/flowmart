import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getVendorPublicProfile, getCategories } from '../controllers/product.controller';
import { authenticateJWT, optionalAuthenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

router.get('/categories', getCategories);
router.get('/', optionalAuthenticateJWT, getProducts);
router.get('/:id', getProductById); 
router.post('/', authenticateJWT, authorizeRoles('vendor', 'super_admin'), validateRequest({ body: createProductSchema }), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), validateRequest({ body: updateProductSchema }), updateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('vendor', 'super_admin'), deleteProduct);

export default router;