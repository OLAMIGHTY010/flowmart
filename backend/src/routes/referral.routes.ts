import { Router } from "express";
import { getReferralStats, mockFirstPurchaseTrigger } from "../controllers/referral.controller";
import { protect } from "../middleware/auth.middleware"; 

const router = Router();

router.use(protect);

router.get("/stats", getReferralStats);
router.post("/trigger-purchase", mockFirstPurchaseTrigger);

export default router;
