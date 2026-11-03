import { Router } from 'express';
import { autocompletePostcode, verifyPostcode } from '../controllers/postcode.controller';
import { optionalAuthenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { postcodeAutocompleteLimiter, postcodeVerifyLimiter } from '../middleware/rateLimiter.middleware';
import { autocompleteQuerySchema, verifyPostcodeQuerySchema } from '../schemas/postcode.schema';

const router = Router();

// Autocomplete is rate limited to 60 requests/min with optional authentication
router.get(
  '/autocomplete',
  optionalAuthenticateJWT,
  postcodeAutocompleteLimiter,
  validateRequest({ query: autocompleteQuerySchema }),
  autocompletePostcode
);

// Verification is rate limited to 20 requests/min with optional authentication
router.get(
  '/verify',
  optionalAuthenticateJWT,
  postcodeVerifyLimiter,
  validateRequest({ query: verifyPostcodeQuerySchema }),
  verifyPostcode
);

export default router;
