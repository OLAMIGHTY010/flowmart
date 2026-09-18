import { globalApiLimiter, authApiLimiter } from '../../middleware/rateLimiter.middleware';

describe('Rate Limiter Middleware', () => {
  it('should export defined globalApiLimiter middleware', () => {
    expect(globalApiLimiter).toBeDefined();
    expect(typeof globalApiLimiter).toBe('function');
  });

  it('should export defined authApiLimiter middleware', () => {
    expect(authApiLimiter).toBeDefined();
    expect(typeof authApiLimiter).toBe('function');
  });
});
