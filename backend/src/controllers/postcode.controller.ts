import { Request, Response } from 'express';
import { PostcodeService, PostcodeError } from '../services/postcode.service';

/**
 * Autocomplete postcode segments
 * GET /api/v1/postcode/autocomplete?q=...
 */
export const autocompletePostcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const result = await PostcodeService.autocomplete(q);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof PostcodeError) {
      if (error.statusCode === 429 && error.retryAfter) {
        res.setHeader('Retry-After', error.retryAfter.toString());
      }
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        suggestion: error.suggestion,
      });
      return;
    }

    console.error('[PostcodeController.autocomplete Error]', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during postcode autocomplete',
    });
  }
};

/**
 * Verify postcode validity (Level 1)
 * GET /api/v1/postcode/verify?code=...
 */
export const verifyPostcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = (req.query.code as string) || '';
    const result = await PostcodeService.lookupPostcode(code, 1);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof PostcodeError) {
      if (error.statusCode === 429 && error.retryAfter) {
        res.setHeader('Retry-After', error.retryAfter.toString());
      }
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        suggestion: error.suggestion,
        isUpstreamUnavailable: error.isUpstreamUnavailable,
      });
      return;
    }

    console.error('[PostcodeController.verify Error]', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during postcode verification',
    });
  }
};
