/**
 * ============================================================================
 * AI & MACHINE LEARNING FRONTEND CLIENT SERVICES
 * ============================================================================
 *
 * Integrates frontend components with FlowMart AI services:
 * - Recommendations (Personalized feeds, Frequently Bought Together, Related)
 * - Semantic Natural Language Search
 * - Merchant Listing Generator & Pricing Copilot
 * - Demand Forecasting & Inventory Stockout Warnings
 * - Review Sentiment & AI Highlights
 * - Order Risk Assessment
 *
 * @module frontend/src/services/AIServices
 */

import { apiClient } from './api';

export interface RecommendationProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  oldPrice?: string | null;
  images: any;
  stockQuantity: number | null;
  productType: string;
  categoryId: string | null;
  brand: string | null;
  recommendationScore: number;
  reason?: string;
}

export interface BundleRecommendation {
  primaryProduct: any;
  bundledProducts: RecommendationProduct[];
  originalTotalPrice: number;
  bundleDiscountPercent: number;
  bundleTotalPrice: number;
  savingsAmount: number;
}

export interface ReviewAISummary {
  productId: string;
  totalReviews: number;
  averageRating: number;
  sentimentBreakdown: {
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
  };
  overallVerdict: string;
  topPros: string[];
  topCons: string[];
  aspectRatings: {
    productQuality: number;
    deliverySpeed: number;
    valueForMoney: number;
  };
}

export interface MerchantListingGenerationResult {
  optimizedTitle: string;
  description: string;
  bulletHighlights: string[];
  suggestedCategory: string;
  seoTags: string[];
  suggestedPriceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface MerchantPricingAdviceResult {
  currentPrice?: number;
  sampleSize: number;
  marketStats: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    average: number;
  };
  recommendations: {
    competitivePrice: number;
    optimalPrice: number;
    premiumPrice: number;
  };
  pricePositionSummary: string;
  marginAdvice: string;
}

export const aiServices = {
  /**
   * Get personalized product feed for authenticated user or trending items
   */
  getPersonalizedRecommendations: async (limit: number = 8): Promise<RecommendationProduct[]> => {
    const res = await apiClient.get<{ success: boolean; data: RecommendationProduct[] }>(
      `/ai/recommendations/personalized?limit=${limit}`
    );
    return res.data || [];
  },

  /**
   * Get frequently bought together product bundle with discounted price
   */
  getFrequentlyBoughtTogether: async (
    productId: string,
    limit: number = 3
  ): Promise<BundleRecommendation | null> => {
    const res = await apiClient.get<{ success: boolean; data: BundleRecommendation }>(
      `/ai/recommendations/frequently-bought-together/${productId}?limit=${limit}`
    );
    return res.data || null;
  },

  /**
   * Get content-similar related products
   */
  getRelatedProducts: async (productId: string, limit: number = 6): Promise<RecommendationProduct[]> => {
    const res = await apiClient.get<{ success: boolean; data: RecommendationProduct[] }>(
      `/ai/recommendations/related/${productId}?limit=${limit}`
    );
    return res.data || [];
  },

  /**
   * Natural language semantic search
   */
  semanticSearch: async (query: string, limit: number = 15) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/ai/search/semantic?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return res.data;
  },

  /**
   * Generate an optimized product listing using Merchant AI Copilot
   */
  generateMerchantListing: async (payload: {
    title: string;
    category?: string;
    roughNotes?: string;
    brand?: string;
    condition?: string;
    productType?: string;
  }): Promise<MerchantListingGenerationResult> => {
    const res = await apiClient.post<{ success: boolean; data: MerchantListingGenerationResult }>(
      '/ai/merchant/generate-listing',
      payload
    );
    return res.data;
  },

  /**
   * Get competitive category pricing advice for merchants
   */
  getPricingAdvice: async (payload: {
    categoryId?: string;
    currentPrice?: number;
    productId?: string;
  }): Promise<MerchantPricingAdviceResult> => {
    const res = await apiClient.post<{ success: boolean; data: MerchantPricingAdviceResult }>(
      '/ai/merchant/pricing-advisor',
      payload
    );
    return res.data;
  },

  /**
   * Product Demand Forecast (Holt's Linear Trend)
   */
  getProductDemandForecast: async (productId: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/ai/analytics/forecast/product/${productId}`
    );
    return res.data;
  },

  /**
   * Vendor / Admin Inventory Health audit
   */
  getInventoryHealth: async (vendorId?: string) => {
    const query = vendorId ? `?vendorId=${vendorId}` : '';
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/ai/analytics/inventory-health${query}`
    );
    return res.data;
  },

  /**
   * Get AI-generated summary of customer reviews
   */
  getProductReviewSummary: async (productId: string): Promise<ReviewAISummary> => {
    const res = await apiClient.get<{ success: boolean; data: ReviewAISummary }>(
      `/ai/reviews/summary/${productId}`
    );
    return res.data;
  },

  /**
   * Evaluate transaction risk score
   */
  assessOrderRisk: async (payload: {
    userId?: string;
    totalAmount: number;
    paymentMethod: string;
    deliveryZone?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      '/ai/fraud/assess-order',
      payload
    );
    return res.data;
  },
};

export const AIServices = aiServices;

