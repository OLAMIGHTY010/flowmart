import { Router } from 'express';
import rateLimit from 'express-rate-limit';

// Route Imports
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vendorRoutes from './vendor.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import riderRoutes from './rider.routes';
import welfareRoutes from './welfare.routes';
import syncRoutes from './sync.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import userManagementRoutes from './user-management.routes';
import paymentRoutes from './payment.routes'; // Dedicated Paystack/Payment routing

// Controller & Middleware Imports
import { authenticateJWT } from '../middleware/auth.middleware';
import { getVendorPublicProfile } from '../controllers/product.controller';

const router = Router();

// Apply Rate Limiting to Auth Endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per window
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

// ----------------------------------------------------------------------
// Core API Mount Points
// ----------------------------------------------------------------------

// Auth & Users
router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);

// Core Commerce
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes); 

// Dashboards & Roles
router.use('/vendors', vendorRoutes);
router.use('/rider', riderRoutes); 
router.use('/riders', riderRoutes); // Alias for safety
router.use('/welfare', welfareRoutes);

// Admin & Sync
router.use('/admin', adminRoutes);
router.use('/user-management', userManagementRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/sync', syncRoutes);

router.get('/vendors/:id', authenticateJWT, getVendorPublicProfile);

export default router;