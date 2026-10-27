import request from 'supertest';
import express from 'express';
import postcodeRoutes from '../../routes/postcode.routes';
import { PostcodeService, PostcodeError } from '../../services/postcode.service';

// Mock PostcodeService methods while keeping PostcodeError real
jest.mock('../../services/postcode.service', () => {
  const actual = jest.requireActual('../../services/postcode.service');
  return {
    ...actual,
    PostcodeService: {
      autocomplete: jest.fn(),
      lookupPostcode: jest.fn(),
      resolveAddressTrust: jest.fn(),
    },
  };
});

// Mock auth middleware to test both authorized and unauthorized states
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer valid-token')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = { id: 'usr-123', email: 'test@flowmart.ng', role: 'user' };
    next();
  },
  authorizeRoles: () => (req: any, res: any, next: any) => next(),
}));

// Mock rate limiters as pass-through for unit tests
jest.mock('../../middleware/rateLimiter.middleware', () => ({
  postcodeAutocompleteLimiter: (req: any, res: any, next: any) => next(),
  postcodeVerifyLimiter: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/postcode', postcodeRoutes);

describe('Postcode Routes (/api/v1/postcode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/postcode/autocomplete', () => {
    it('should return 401 Unauthorized if auth token is missing', async () => {
      const res = await request(app).get('/api/v1/postcode/autocomplete?q=LA-11');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request if q param is missing', async () => {
      const res = await request(app)
        .get('/api/v1/postcode/autocomplete')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 400 Bad Request if q param contains invalid characters', async () => {
      const res = await request(app)
        .get('/api/v1/postcode/autocomplete?q=!!!')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 200 with suggestions on valid query', async () => {
      const mockResult = {
        query: 'LA-11',
        suggestions: [
          { code: 'LA-11-201', state: 'Lagos', lga: 'Ikeja', description: 'Ikeja Central' },
        ],
      };
      (PostcodeService.autocomplete as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/postcode/autocomplete?q=LA-11')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(PostcodeService.autocomplete).toHaveBeenCalledWith('LA-11');
    });
  });

  describe('GET /api/v1/postcode/verify', () => {
    it('should return 401 Unauthorized if auth token is missing', async () => {
      const res = await request(app).get('/api/v1/postcode/verify?code=LA-11-H77-BB-55');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request if code param is missing', async () => {
      const res = await request(app)
        .get('/api/v1/postcode/verify')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 with suggestion in validation errors when lookalike code is submitted', async () => {
      const res = await request(app)
        .get('/api/v1/postcode/verify?code=LA-11-H77-BB-SS')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors[0].message).toContain('Did you mean');
    });

    it('should return 200 with valid=true when postcode is valid', async () => {
      const mockLookup = {
        postcode: 'LA-11-H77-BB-55',
        valid: true,
        source: 'nipost_level_1',
      };
      (PostcodeService.lookupPostcode as jest.Mock).mockResolvedValue(mockLookup);

      const res = await request(app)
        .get('/api/v1/postcode/verify?code=LA-11-H77-BB-55')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(PostcodeService.lookupPostcode).toHaveBeenCalledWith('LA-11-H77-BB-55', 1);
    });

    it('should return 404 when postcode is not found upstream', async () => {
      (PostcodeService.lookupPostcode as jest.Mock).mockRejectedValue(
        new PostcodeError({
          message: 'Postcode not found in national registry',
          statusCode: 404,
          code: 'POSTCODE_NOT_FOUND',
        })
      );

      const res = await request(app)
        .get('/api/v1/postcode/verify?code=LA-11-H77-BB-55')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('POSTCODE_NOT_FOUND');
    });

    it('should return 503 when upstream service is unavailable', async () => {
      (PostcodeService.lookupPostcode as jest.Mock).mockRejectedValue(
        new PostcodeError({
          message: 'Postcode verification service is temporarily unavailable',
          statusCode: 503,
          code: 'UPSTREAM_SERVER_ERROR',
          isUpstreamUnavailable: true,
        })
      );

      const res = await request(app)
        .get('/api/v1/postcode/verify?code=LA-11-H77-BB-55')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.isUpstreamUnavailable).toBe(true);
    });
  });
});
