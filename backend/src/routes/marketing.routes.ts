import { Router } from "express";
import { boostProduct, getVendorCampaigns } from "../controllers/marketing.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.post("/boost", boostProduct);
router.get("/campaigns", getVendorCampaigns);

export default router;
