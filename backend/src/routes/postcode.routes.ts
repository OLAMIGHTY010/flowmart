import { Router } from 'express';
import { autocompletePostcode, verifyPostcode } from '../controllers/postcode.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { postcodeAutocompleteLimiter, postcodeVerifyLimiter } from '../middleware/rateLimiter.middleware';
import { autocompleteQuerySchema, verifyPostcodeQuerySchema } from '../schemas/postcode.schema';

const router = Router();

// Autocomplete is rate limited to 60 requests/min and requires authentication
router.get(
  '/autocomplete',
  authenticateJWT,
  postcodeAutocompleteLimiter,
  validateRequest({ query: autocompleteQuerySchema }),
  autocompletePostcode
);

// Verification is rate limited to 20 requests/min and requires authentication
router.get(
  '/verify',
  authenticateJWT,
  postcodeVerifyLimiter,
  validateRequest({ query: verifyPostcodeQuerySchema }),
  verifyPostcode
);

export default router;
