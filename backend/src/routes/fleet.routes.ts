import { Router } from "express";
import { getFleetProfile, getFleetRiders } from "../controllers/fleet.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/profile", getFleetProfile);
router.get("/riders", getFleetRiders);

export default router;
