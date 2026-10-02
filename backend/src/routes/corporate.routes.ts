import { Router } from "express";
import { getCorporateProfile, updateCreditLimitRequest } from "../controllers/corporate.controller";
import { protect } from "../middlewares/auth.middleware"; // Assuming this middleware exists

const router = Router();

router.use(protect);

router.get("/profile", getCorporateProfile);
router.post("/credit-limit-request", updateCreditLimitRequest);

export default router;
