import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Mount the Auth module routes
router.use('/auth', authRoutes);

// TODO: Mount future module routes here
// router.use('/welfare', welfareRoutes);
// router.use('/vendors', vendorRoutes);
// router.use('/orders', orderRoutes);

export default router;
