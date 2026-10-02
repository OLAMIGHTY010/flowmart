import { Router } from "express";
import { initiateHighValueEscrow, releaseEscrow, getMyEscrows } from "../controllers/escrow.controller";
import { protect } from "../middlewares/auth.middleware"; // Assuming standard auth middleware

const router = Router();

router.use(protect);

router.post("/initiate", initiateHighValueEscrow);
router.post("/:escrowId/release", releaseEscrow);
router.get("/my-escrows", getMyEscrows);

export default router;
