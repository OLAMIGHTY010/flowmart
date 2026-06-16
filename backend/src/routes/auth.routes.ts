import { Router } from "express";
import {
	register,
	login,
	verifyOtp,
	requestPasswordReset,
	resetPassword,
	adminCreateUser,
} from "../controllers/auth.controller";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// SECURITY FIX --- Guarded system configuration for assigning authorized elevated roles
router.post(
	"/admin/create-user",
	authenticateJWT,
	authorizeRoles("super_admin"),
	adminCreateUser
);

export default router;
