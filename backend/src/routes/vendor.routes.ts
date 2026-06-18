import { Router } from "express";
import { updateProfile, submitKYC, getKYCStatus, getVendorStats } from "../controllers/vendor.controller";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Apply JWT authentication and verify vendor role for all routes
router.use(authenticateJWT);
router.use(authorizeRoles("vendor", "super_admin"));

router.put("/profile", updateProfile);
router.post("/kyc/submit", submitKYC);
router.get("/kyc/status", getKYCStatus);
router.get("/dashboard/stats", getVendorStats);
import { Router } from 'express';
import { saveVendorProfile, submitKYC, getKYCStatus } from '../controllers/vendor.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT, authorizeRoles('vendor', 'super_admin'));

router.post('/profile', saveVendorProfile);
router.post('/kyc/submit', submitKYC);
router.get('/kyc/status', getKYCStatus);

export default router;
