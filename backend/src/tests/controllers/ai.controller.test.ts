/**
 * ============================================================================
 * UNIT TESTS: AI CONTROLLER (13 ENDPOINTS)
 * ============================================================================
 *
 * Tests:
 * 1. processShoppingQuery (validation, escalation, recommendations)
 * 2. getPersonalizedFeed
 * 3. getFrequentlyBought (success & 404)
 * 4. getRelated
 * 5. handleSemanticSearch (success & 400 missing query)
 * 6. handleMerchantGenerateListing (success & 400 missing title)
 * 7. handleMerchantPricingAdvisor
 * 8. handleProductDemandForecast (success & 404)
 * 9. handleInventoryHealth
 * 10. handleAnalyzeReviewSentiment
 * 11. handleProductReviewSummary
 * 12. handleAssessOrderRisk (success & 400 missing fields)
 * 13. handleGetFraudAuditList
 */

import {
  processShoppingQuery,
  getPersonalizedFeed,
  getFrequentlyBought,
  getRelated,
  handleSemanticSearch,
  handleMerchantGenerateListing,
  handleMerchantPricingAdvisor,
  handleProductDemandForecast,
  handleInventoryHealth,
  handleAnalyzeReviewSentiment,
  handleProductReviewSummary,
  handleAssessOrderRisk,
  handleGetFraudAuditList,
} from '../../controllers/ai.controller';

// Mock DB
jest.mock('../../../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
  },
}));

// Mock services to verify controller delegation
jest.mock('../../services/ai/ai-provider.service', () => ({
  executeAIGeneration: jest.fn().mockResolvedValue('{"shouldEscalate": false}'),
  extractJsonFromResponse: jest.fn((text, fallback) => fallback),
}));

jest.mock('../../services/ai/recommendation.service', () => ({
  getPersonalizedRecommendations: jest.fn().mockResolvedValue([{ id: 'p-1', name: 'Shoes' }]),
  getFrequentlyBoughtTogether: jest.fn().mockImplementation((id: string) => {
    if (id === 'non-existent') return null;
    return { primaryProduct: { id }, bundledProducts: [], bundleTotalPrice: 5000 };
  }),
  getRelatedProducts: jest.fn().mockResolvedValue([{ id: 'p-2', name: 'Similar Shoes' }]),
}));

jest.mock('../../services/ai/semantic-search.service', () => ({
  executeSemanticSearch: jest.fn().mockResolvedValue({
    query: 'phones',
    products: [{ id: 'ph-1', name: 'iPhone 13' }],
    vendors: [],
    totalMatches: 1,
  }),
}));

jest.mock('../../services/ai/merchant-copilot.service', () => ({
  generateProductListing: jest.fn().mockResolvedValue({
    optimizedTitle: 'Generated Title',
    description: 'Generated Description',
    bulletHighlights: ['Highlight 1'],
    suggestedCategory: 'Retail',
  }),
  getSmartPricingAdvice: jest.fn().mockResolvedValue({
    marketStats: { median: 10000 },
    recommendations: { optimalPrice: 10000 },
  }),
}));

jest.mock('../../services/ai/demand-forecasting.service', () => ({
  forecastProductDemand: jest.fn().mockImplementation((id: string) => {
    if (id === 'non-existent') return null;
    return { productId: id, stockoutRisk: 'OPTIMAL' };
  }),
  getInventoryHealthOverview: jest.fn().mockResolvedValue({
    totalProductsAudited: 5,
    healthyCount: 5,
  }),
}));

jest.mock('../../services/ai/sentiment-analysis.service', () => ({
  calculateLexiconSentiment: jest.fn().mockReturnValue({
    score: 0.8,
    label: 'POSITIVE',
    aspectTags: ['product_quality'],
  }),
  summarizeProductReviews: jest.fn().mockResolvedValue({
    totalReviews: 10,
    averageRating: 4.8,
    overallVerdict: 'High quality',
  }),
}));

jest.mock('../../services/ai/fraud-detection.service', () => ({
  assessOrderRisk: jest.fn().mockResolvedValue({
    riskScore: 15,
    riskLevel: 'LOW',
    recommendedAction: 'APPROVE',
  }),
  getAuditRiskOrders: jest.fn().mockResolvedValue([{ orderId: 'ord-1', riskScore: 85 }]),
}));

// Helpers to construct mock req and res
function createMockReq(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { id: 'test-user-id', role: 'vendor' },
    ip: '127.0.0.1',
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AI Controller Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. processShoppingQuery', () => {
    it('returns 400 if messages array is missing or empty', async () => {
      const req = createMockReq({ body: { messages: [] } });
      const res = createMockRes();

      await processShoppingQuery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 200 with chat response when messages are valid', async () => {
      const req = createMockReq({
        body: { messages: [{ role: 'user', content: 'Do you sell phones?' }] },
      });
      const res = createMockRes();

      await processShoppingQuery(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ reply: expect.any(String) }),
        })
      );
    });
  });

  describe('2. getPersonalizedFeed', () => {
    it('returns 200 with personalized items', async () => {
      const req = createMockReq({ query: { limit: '5' } });
      const res = createMockRes();

      await getPersonalizedFeed(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });
  });

  describe('3. getFrequentlyBought', () => {
    it('returns 200 with bundle when product exists', async () => {
      const req = createMockReq({ params: { productId: 'prod-123' } });
      const res = createMockRes();

      await getFrequentlyBought(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when product is not found', async () => {
      const req = createMockReq({ params: { productId: 'non-existent' } });
      const res = createMockRes();

      await getFrequentlyBought(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('4. getRelated', () => {
    it('returns 200 with related items', async () => {
      const req = createMockReq({ params: { productId: 'prod-123' } });
      const res = createMockRes();

      await getRelated(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });
  });

  describe('5. handleSemanticSearch', () => {
    it('returns 400 if search query parameter is missing', async () => {
      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await handleSemanticSearch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 200 with search results when query is supplied', async () => {
      const req = createMockReq({ query: { q: 'affordable laptops' } });
      const res = createMockRes();

      await handleSemanticSearch(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('6. handleMerchantGenerateListing', () => {
    it('returns 400 if title is missing', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await handleMerchantGenerateListing(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 200 with generated listing when title is provided', async () => {
      const req = createMockReq({ body: { title: 'Designer Handbag' } });
      const res = createMockRes();

      await handleMerchantGenerateListing(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ optimizedTitle: 'Generated Title' }),
        })
      );
    });
  });

  describe('7. handleMerchantPricingAdvisor', () => {
    it('returns 200 with market pricing statistics and tiers', async () => {
      const req = createMockReq({ body: { currentPrice: 5000, categoryId: 'cat-1' } });
      const res = createMockRes();

      await handleMerchantPricingAdvisor(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('8. handleProductDemandForecast', () => {
    it('returns 200 with forecast when product exists', async () => {
      const req = createMockReq({ params: { productId: 'prod-1' } });
      const res = createMockRes();

      await handleProductDemandForecast(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when product is not found', async () => {
      const req = createMockReq({ params: { productId: 'non-existent' } });
      const res = createMockRes();

      await handleProductDemandForecast(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('9. handleInventoryHealth', () => {
    it('returns 200 with inventory health overview', async () => {
      const req = createMockReq({ user: { role: 'vendor', id: 'v-1' } });
      const res = createMockRes();

      await handleInventoryHealth(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('10. handleAnalyzeReviewSentiment', () => {
    it('returns 200 with sentiment polarity and aspect tags', async () => {
      const req = createMockReq({ body: { comment: 'Fast delivery, quality is great', rating: 5 } });
      const res = createMockRes();

      await handleAnalyzeReviewSentiment(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ label: 'POSITIVE' }),
        })
      );
    });
  });

  describe('11. handleProductReviewSummary', () => {
    it('returns 200 with AI review summary', async () => {
      const req = createMockReq({ params: { productId: 'prod-10' } });
      const res = createMockRes();

      await handleProductReviewSummary(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('12. handleAssessOrderRisk', () => {
    it('returns 400 when totalAmount or userId are missing', async () => {
      const req = createMockReq({ body: {}, user: undefined });
      const res = createMockRes();

      await handleAssessOrderRisk(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 200 with risk assessment result', async () => {
      const req = createMockReq({
        body: { totalAmount: 25000, paymentMethod: 'paystack' },
        user: { id: 'u-1' },
      });
      const res = createMockRes();

      await handleAssessOrderRisk(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ riskScore: 15, riskLevel: 'LOW' }),
        })
      );
    });
  });

  describe('13. handleGetFraudAuditList', () => {
    it('returns 200 with flagged transactions for admin', async () => {
      const req = createMockReq({ query: { limit: '10' } });
      const res = createMockRes();

      await handleGetFraudAuditList(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });
  });
});
