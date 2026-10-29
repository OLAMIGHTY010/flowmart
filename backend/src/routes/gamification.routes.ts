import { Router } from 'express';
import {
  getFoodieWrapped,
  getScratchCard,
  claimScratchCard,
  getReferralMilestones
} from '../controllers/gamification.controller';

const router = Router();

router.get('/wrapped', getFoodieWrapped);
router.get('/scratch-card', getScratchCard);
router.post('/scratch-card/claim', claimScratchCard);
router.get('/referrals', getReferralMilestones);

export default router;
