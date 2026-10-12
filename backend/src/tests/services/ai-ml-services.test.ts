/**
 * ============================================================================
 * EXHAUSTIVE UNIT TESTS: FLOWMART AI & MACHINE LEARNING SERVICES
 * ============================================================================
 *
 * Covers:
 * 1. AI Provider Service (JSON parsing & fallback resilience)
 * 2. Hybrid Recommendation Engine (Collaborative Filtering, Content-Based, Personalized)
 * 3. Semantic Search & Natural Language Query Parser (Budget, Condition, Categories)
 * 4. Merchant AI Copilot (Listing Generator & Statistical Quantile Pricing Model)
 * 5. Predictive Demand Forecasting & Stockout Logic (Holt's Linear Trend & Runout Days)
 * 6. Review Intelligence & Sentiment Analysis (Lexicon, Rating Blending, Aspects)
 * 7. Fraud & Anomaly Risk Scoring (Statistical Z-Score, Velocity, Escrow Risk)
 */

import { extractJsonFromResponse } from '../../services/ai/ai-provider.service';
import {
  getFrequentlyBoughtTogether,
  getRelatedProducts,
  getPersonalizedRecommendations,
} from '../../services/ai/recommendation.service';
import {
  parseQueryIntent,
  executeSemanticSearch,
} from '../../services/ai/semantic-search.service';
import {
  generateProductListing,
  getSmartPricingAdvice,
} from '../../services/ai/merchant-copilot.service';
import {
  forecastProductDemand,
  getInventoryHealthOverview,
} from '../../services/ai/demand-forecasting.service';
import {
  calculateLexiconSentiment,
  summarizeProductReviews,
} from '../../services/ai/sentiment-analysis.service';
import {
  assessOrderRisk,
  getAuditRiskOrders,
} from '../../services/ai/fraud-detection.service';

// Mock DB module with a fluent queue-driven query mock
jest.mock('../../../db', () => {
  let queue: any[] = [];
  const chain: any = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    update: jest.fn(() => chain),
    set: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    values: jest.fn(() => chain),
    then: (resolve: any) => {
      const result = queue.length > 0 ? queue.shift() : [];
      return Promise.resolve(resolve(result));
    },
    __setQueue: (...items: any[]) => {
      queue = [...items];
    },
    __clearQueue: () => {
      queue = [];
    },
  };
  return { db: chain };
});

import { db } from '../../../db';
const mockDb = db as any;

describe('1. AI Provider Service - Robust JSON Extraction', () => {
  it('correctly parses pure JSON string', () => {
    const raw = '{"key": "value", "count": 42}';
    const result = extractJsonFromResponse(raw, null);
    expect(result).toEqual({ key: 'value', count: 42 });
  });

  it('correctly extracts JSON from Markdown ```json code blocks', () => {
    const raw = '```json\n{"status": "success", "tags": ["smart", "fast"]}\n```';
    const result = extractJsonFromResponse(raw, null);
    expect(result).toEqual({ status: 'success', tags: ['smart', 'fast'] });
  });

  it('correctly extracts JSON embedded inside conversational text', () => {
    const raw = 'Here is your generated response:\n{"optimizedTitle": "Ultra Phone 15"}\nHope this helps!';
    const result = extractJsonFromResponse(raw, null);
    expect(result).toEqual({ optimizedTitle: 'Ultra Phone 15' });
  });

  it('returns default fallback when JSON is malformed or invalid', () => {
    const raw = 'This is plain text with no json at all.';
    const fallback = { fallback: true };
    const result = extractJsonFromResponse(raw, fallback);
    expect(result).toEqual(fallback);
  });
});

describe('2. Hybrid Recommendation Engine', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('returns null if primary product is not found', async () => {
    mockDb.__setQueue([]); // Primary query returns empty
    const result = await getFrequentlyBoughtTogether('non-existent-id');
    expect(result).toBeNull();
  });

  it('calculates bundle pricing and discount for frequently bought together', async () => {
    mockDb.__setQueue(
      [{ id: 'prod-1', name: 'Burger', price: '2000.00', categoryId: 'cat-1', productType: 'food' }], // primary
      [{ orderId: 'ord-101' }, { orderId: 'ord-102' }], // target orders
      [{ productId: 'prod-2' }], // co-occurring orderItems
      [{ id: 'prod-2', name: 'French Fries', price: '1000.00', categoryId: 'cat-1', productType: 'food' }] // products
    );

    const result = await getFrequentlyBoughtTogether('prod-1', 2);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.primaryProduct.name).toBe('Burger');
      expect(result.originalTotalPrice).toBe(3000); // 2000 + 1000
      expect(result.bundleDiscountPercent).toBe(8);
      expect(result.savingsAmount).toBe(240); // 8% of 3000
      expect(result.bundleTotalPrice).toBe(2760); // 3000 - 240
    }
  });

  it('computes content-based related products using category, brand, and price proximity', async () => {
    mockDb.__setQueue(
      [{ id: 'prod-target', name: 'Nike Running Shoes', price: '25000.00', categoryId: 'cat-shoes', brand: 'Nike', productType: 'retail' }],
      [
        { id: 'cand-1', name: 'Nike Zoom', price: '26000.00', categoryId: 'cat-shoes', brand: 'Nike', productType: 'retail' },
        { id: 'cand-2', name: 'Adidas Shoes', price: '24000.00', categoryId: 'cat-shoes', brand: 'Adidas', productType: 'retail' },
        { id: 'cand-3', name: 'Generic Slippers', price: '2000.00', categoryId: 'cat-diff', brand: 'Other', productType: 'retail' },
      ]
    );

    const related = await getRelatedProducts('prod-target', 3);
    expect(related.length).toBe(3);
    expect(related[0].id).toBe('cand-1');
    expect(related[0].recommendationScore).toBeGreaterThan(related[1].recommendationScore);
    expect(related[1].recommendationScore).toBeGreaterThan(related[2].recommendationScore);
  });

  it('returns trending items for unauthenticated guest users in personalized feed', async () => {
    mockDb.__setQueue([
      { id: 'trend-1', name: 'Rice 50kg', price: '75000.00', stockQuantity: 50, productType: 'grocery' },
      { id: 'trend-2', name: 'Cooking Oil 5L', price: '12000.00', stockQuantity: 20, productType: 'grocery' },
    ]);

    const feed = await getPersonalizedRecommendations(undefined, 2);
    expect(feed.length).toBe(2);
    expect(feed[0].reason).toBe('Trending on FlowMart');
  });
});

describe('3. Semantic Search & NLP Query Parser', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('correctly parses complex Nigerian market queries with currency & conditions', async () => {
    const intent = await parseQueryIntent('tokunbo toyota corolla below 4.5m');
    expect(intent.condition).toBe('used_good');
    expect(intent.maxPrice).toBe(4500000);
    expect(intent.keywords).toContain('corolla');
  });

  it('extracts grocery product type and under 5000 budget correctly', async () => {
    const intent = await parseQueryIntent('pure groundnut oil under 5000');
    expect(intent.productType).toBe('grocery');
    expect(intent.maxPrice).toBe(5000);
    expect(intent.keywords).toContain('groundnut');
  });

  it('executes semantic search and returns matched products and vendors', async () => {
    mockDb.__setQueue(
      [{ id: 'p1', name: 'Yam flour', price: '3000.00', productType: 'grocery' }],
      [{ id: 'v1', businessName: 'Ibadan Staples Store', displayName: 'Ibadan Staples' }]
    );

    const result = await executeSemanticSearch('yam flour', 10);
    expect(result.products.length).toBe(1);
    expect(result.vendors.length).toBe(1);
    expect(result.totalMatches).toBe(2);
  });
});

describe('4. Merchant AI Copilot: Listing & Pricing Intelligence', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('generates high quality listing draft with fallback on offline LLM', async () => {
    const listing = await generateProductListing({
      title: 'Original Leather Shoes',
      category: 'Footwear',
      roughNotes: 'Handmade Italian leather loafers, brown size 42',
    });

    expect(listing.optimizedTitle).toBeTruthy();
    expect(listing.description).toContain('Italian leather');
    expect(listing.bulletHighlights.length).toBeGreaterThan(0);
    expect(listing.seoTags.length).toBeGreaterThan(0);
  });

  it('computes accurate statistical quartiles and optimal price tiers', async () => {
    mockDb.__setQueue([
      { price: '5000.00' },
      { price: '6000.00' },
      { price: '7000.00' },
      { price: '8000.00' },
      { price: '9000.00' },
      { price: '10000.00' },
    ]);

    const advice = await getSmartPricingAdvice('cat-shoes', 7500);
    expect(advice.sampleSize).toBe(6);
    expect(advice.marketStats.min).toBe(5000);
    expect(advice.marketStats.max).toBe(10000);
    expect(advice.marketStats.median).toBe(8000);
    expect(advice.recommendations.competitivePrice).toBeLessThanOrEqual(advice.recommendations.optimalPrice);
    expect(advice.recommendations.optimalPrice).toBeLessThanOrEqual(advice.recommendations.premiumPrice);
    expect(advice.pricePositionSummary).toContain('7,500');
  });

  it('provides safe baseline when no competitor data exists in category', async () => {
    mockDb.__setQueue([]);

    const advice = await getSmartPricingAdvice('new-cat', 15000);
    expect(advice.sampleSize).toBe(0);
    expect(advice.recommendations.optimalPrice).toBe(15000);
    expect(advice.recommendations.competitivePrice).toBe(Math.round(15000 * 0.92));
  });
});

describe('5. Time-Series Demand Forecasting & Stockout Logic', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('returns null if product does not exist', async () => {
    mockDb.__setQueue([]);
    const forecast = await forecastProductDemand('unknown-prod');
    expect(forecast).toBeNull();
  });

  it('computes Holt linear trend, days to stockout, and reorder quantities', async () => {
    mockDb.__setQueue(
      [{ id: 'p-1', name: 'Jollof Pack', stockQuantity: 10, price: '3500.00' }],
      [
        { quantity: 2, createdAt: new Date() },
        { quantity: 4, createdAt: new Date() },
      ]
    );

    const forecast = await forecastProductDemand('p-1');
    expect(forecast).not.toBeNull();
    if (forecast) {
      expect(forecast.productId).toBe('p-1');
      expect(forecast.currentStock).toBe(10);
      expect(forecast.forecastNext7Days.length).toBe(7);
      expect(forecast.daysUntilStockout).toBeGreaterThan(0);
      expect(['CRITICAL', 'WARNING', 'OPTIMAL', 'OVERSTOCKED']).toContain(forecast.stockoutRisk);
    }
  });

  it('generates vendor inventory health overview and flags critical stockouts', async () => {
    mockDb.__setQueue([
      { id: 'item-1', name: 'Low Stock Item', stockQuantity: 2, price: '5000.00' },
      { id: 'item-2', name: 'Healthy Item', stockQuantity: 100, price: '2000.00' },
    ]);

    const health = await getInventoryHealthOverview('vendor-1');
    expect(health.totalProductsAudited).toBe(2);
    expect(health.healthyCount + health.warningStockoutCount + health.criticalStockoutCount).toBe(2);
  });
});

describe('6. Review Intelligence & Sentiment Analysis', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('accurately calculates positive polarity with regional slang', () => {
    const pos = calculateLexiconSentiment('This product is original, sweet and very sharp!', 5);
    expect(pos.label).toBe('POSITIVE');
    expect(pos.score).toBeGreaterThan(0.3);
  });

  it('accurately identifies delivery and quality negative aspects', () => {
    const neg = calculateLexiconSentiment('Fake item! Broken package and late delivery by rider', 1);
    expect(neg.label).toBe('NEGATIVE');
    expect(neg.aspectTags).toContain('product_quality');
    expect(neg.aspectTags).toContain('delivery_speed');
    expect(neg.aspectTags).toContain('packaging');
  });

  it('generates product review summary even with 0 reviews gracefully', async () => {
    mockDb.__setQueue([]);

    const summary = await summarizeProductReviews('prod-empty');
    expect(summary.totalReviews).toBe(0);
    expect(summary.averageRating).toBe(0);
    expect(summary.overallVerdict).toContain('No reviews');
  });

  it('aggregates multiple reviews and calculates percentage breakdown', async () => {
    mockDb.__setQueue([
      { comment: 'Great quality, original product', rating: 5 },
      { comment: 'Super fast delivery and clean packaging', rating: 5 },
      { comment: 'Terrible, defective and waste of money', rating: 1 },
    ]);

    const summary = await summarizeProductReviews('prod-with-reviews');
    expect(summary.totalReviews).toBe(3);
    expect(summary.averageRating).toBeCloseTo(3.7, 1);
    expect(summary.sentimentBreakdown.positivePercent).toBeGreaterThanOrEqual(60);
    expect(summary.sentimentBreakdown.negativePercent).toBeGreaterThanOrEqual(30);
  });
});

describe('7. Fraud & Anomaly Risk Detection', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  it('flags unverified new accounts with critical transaction risk', async () => {
    mockDb.__setQueue(
      [{ id: 'u-fraud', isVerified: false, createdAt: new Date() }], // user
      [], // past orders
      [] // disputes
    );

    const assessment = await assessOrderRisk({
      userId: 'u-fraud',
      totalAmount: 300000, // ₦300,000 first order
      paymentMethod: 'pay_on_delivery',
    });

    expect(assessment.riskScore).toBeGreaterThan(50);
    expect(assessment.riskFactors.some((f) => f.includes('Brand new account'))).toBe(true);
    expect(assessment.riskFactors.some((f) => f.includes('Unverified user'))).toBe(true);
    expect(assessment.riskFactors.some((f) => f.includes('High-ticket'))).toBe(true);
  });

  it('computes Z-score anomaly for orders 3x above normal average', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);

    mockDb.__setQueue(
      [{ id: 'u-good', isVerified: true, createdAt: oldDate }],
      [
        { totalAmount: '10000.00', createdAt: oldDate },
        { totalAmount: '12000.00', createdAt: oldDate },
        { totalAmount: '9000.00', createdAt: oldDate },
        { totalAmount: '11000.00', createdAt: oldDate },
      ],
      [] // disputes
    );

    const assessment = await assessOrderRisk({
      userId: 'u-good',
      totalAmount: 150000, // 15x normal
      paymentMethod: 'paystack',
    });

    expect(assessment.zScore).toBeGreaterThan(3.0);
    expect(assessment.riskFactors.some((f) => f.includes('Extreme order value anomaly'))).toBe(true);
  });

  it('allows safe orders from established users with low risk score', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 150);

    mockDb.__setQueue(
      [{ id: 'u-regular', isVerified: true, createdAt: oldDate }],
      [
        { totalAmount: '5000.00', createdAt: oldDate },
        { totalAmount: '6000.00', createdAt: oldDate },
        { totalAmount: '4500.00', createdAt: oldDate },
      ],
      [] // disputes
    );

    const assessment = await assessOrderRisk({
      userId: 'u-regular',
      totalAmount: 5500,
      paymentMethod: 'paystack',
    });

    expect(assessment.riskScore).toBeLessThan(30);
    expect(assessment.riskLevel).toBe('LOW');
    expect(assessment.recommendedAction).toBe('APPROVE');
  });

  it('retrieves flagged orders for admin audit', async () => {
    mockDb.__setQueue(
      [
        {
          id: 'ord-risky',
          orderRef: 'FM-999',
          userId: 'u-risky',
          totalAmount: '400000.00',
          paymentMethod: 'pay_on_delivery',
          deliveryZone: 'Lagos',
          createdAt: new Date(),
        },
      ],
      [{ id: 'u-risky', isVerified: false, createdAt: new Date() }], // user
      [], // past orders
      [] // disputes
    );

    const audits = await getAuditRiskOrders(5);
    expect(Array.isArray(audits)).toBe(true);
  });
});
