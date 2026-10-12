import { Router } from "express";
import { getCorporateProfile, updateCreditLimitRequest } from "../controllers/corporate.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.get("/profile", getCorporateProfile);
router.post("/credit-limit-request", updateCreditLimitRequest);

export default router;
