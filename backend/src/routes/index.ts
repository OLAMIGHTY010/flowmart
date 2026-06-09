import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import riderRoutes from './rider.routes';
import welfareRoutes from './welfare.routes';
import syncRoutes from './sync.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/riders', riderRoutes);
router.use('/welfare', welfareRoutes);
router.use('/sync', syncRoutes);
router.use('/analytics', analyticsRoutes);

export default router;