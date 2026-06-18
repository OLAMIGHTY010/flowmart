import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import riderRoutes from './rider.routes';
import welfareRoutes from './welfare.routes';
import syncRoutes from './sync.routes';
import analyticsRoutes from './analytics.routes';
import vendorRoutes from './vendor.routes';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getVendorPublicProfile } from '../controllers/product.controller';
import adminRoutes from './admin.routes';
import userManagementRoutes from './user-management.routes';
import userRoutes from './user.routes';
import vendorRoutes from './vendor.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/riders', riderRoutes);
router.use('/welfare', welfareRoutes);
router.use('/sync', syncRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/user-management', userManagementRoutes);

// Public vendor profile (accessible to any authenticated user)
router.get('/vendors/:id', authenticateJWT, getVendorPublicProfile);

export default router;