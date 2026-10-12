/**
 * ============================================================================
 * AI & MACHINE LEARNING API ROUTES
 * ============================================================================
 *
 * Base Path: /api/v1/ai
 *
 * Exposes endpoints for:
 * - Conversational Shopping Assistant
 * - Personalized & Collaborative Recommendations
 * - Smart Semantic Search & Intent Parsing
 * - Merchant AI Listing Generator & Pricing Advisor
 * - Demand Forecasting & Inventory Stockout Predictions
 * - Review Sentiment Intelligence & Digest
 * - Transaction & Order Fraud Risk Detection
 *
 * @module backend/src/routes/ai.routes
 */

import { Router } from 'express';
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
} from '../controllers/ai.controller';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  authorizeRoles,
} from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// 1. CONVERSATIONAL ASSISTANT & SEMANTIC SEARCH
// ============================================================================

/**
 * @openapi
 * /ai/chat:
 *   post:
 *     tags:
 *       - AI & Machine Learning
 *     summary: AI Conversational Shopping Assistant
 *     description: Multi-turn shopping chat with semantic search, cart actions, and sentiment escalation.
 *     responses:
 *       200:
 *         description: AI shopping response with recommended products.
 */
router.post('/chat', optionalAuthenticateJWT, processShoppingQuery);

/**
 * @openapi
 * /ai/search/semantic:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Natural Language Semantic Search
 *     description: Extracts budget, category, condition, and semantic keywords from free-form queries.
 */
router.get('/search/semantic', optionalAuthenticateJWT, handleSemanticSearch);

// ============================================================================
// 2. PERSONALIZED & COLLABORATIVE RECOMMENDATIONS
// ============================================================================

/**
 * @openapi
 * /ai/recommendations/personalized:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Personalized Product Feed
 *     description: Generates user feed based on order history, wishlist, and category affinities.
 */
router.get('/recommendations/personalized', optionalAuthenticateJWT, getPersonalizedFeed);

/**
 * @openapi
 * /ai/recommendations/frequently-bought-together/{productId}:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Frequently Bought Together (Item Co-occurrence)
 *     description: Collaborative filtering bundle recommendations with bundled discount calculation.
 */
router.get('/recommendations/frequently-bought-together/:productId', optionalAuthenticateJWT, getFrequentlyBought);

/**
 * @openapi
 * /ai/recommendations/related/{productId}:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Content-Based Related Products
 *     description: Recommends items matching category, price proximity, and brand.
 */
router.get('/recommendations/related/:productId', optionalAuthenticateJWT, getRelated);

// ============================================================================
// 3. MERCHANT AI COPILOT
// ============================================================================

/**
 * @openapi
 * /ai/merchant/generate-listing:
 *   post:
 *     tags:
 *       - AI & Machine Learning
 *     summary: AI Product Listing Generator
 *     description: Generates SEO-optimized titles, descriptions, categories, and tags from draft notes.
 */
router.post('/merchant/generate-listing', authenticateJWT, authorizeRoles('vendor', 'admin', 'super_admin'), handleMerchantGenerateListing);

/**
 * @openapi
 * /ai/merchant/pricing-advisor:
 *   post:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Smart Market Pricing Advisor
 *     description: Statistical category competitor pricing analysis (IQR, median, competitive vs premium tiers).
 */
router.post('/merchant/pricing-advisor', authenticateJWT, authorizeRoles('vendor', 'admin', 'super_admin'), handleMerchantPricingAdvisor);

// ============================================================================
// 4. PREDICTIVE DEMAND FORECASTING & INVENTORY ML
// ============================================================================

/**
 * @openapi
 * /ai/analytics/forecast/product/{productId}:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Product Demand Forecast & Stockout Warning
 *     description: Double Exponential Smoothing (Holt's Linear) 7-day forecast and runout days calculation.
 */
router.get('/analytics/forecast/product/:productId', optionalAuthenticateJWT, handleProductDemandForecast);

/**
 * @openapi
 * /ai/analytics/inventory-health:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Inventory Health & Stockout Alerts
 *     description: Audits vendor inventory against sales velocity and highlights urgent restock items.
 */
router.get('/analytics/inventory-health', authenticateJWT, authorizeRoles('vendor', 'admin', 'super_admin'), handleInventoryHealth);

// ============================================================================
// 5. REVIEW INTELLIGENCE & SENTIMENT ANALYSIS
// ============================================================================

/**
 * @openapi
 * /ai/reviews/analyze:
 *   post:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Review Sentiment Polarity Analysis
 *     description: Analyzes comment text for polarity (-1 to 1), label, and aspect tags.
 */
router.post('/reviews/analyze', optionalAuthenticateJWT, handleAnalyzeReviewSentiment);

/**
 * @openapi
 * /ai/reviews/summary/{productId}:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: AI Product Review Digest & Highlights
 *     description: Generates overall consensus, top pros, and top cons from customer feedback.
 */
router.get('/reviews/summary/:productId', optionalAuthenticateJWT, handleProductReviewSummary);

// ============================================================================
// 6. FRAUD & ANOMALY DETECTION
// ============================================================================

/**
 * @openapi
 * /ai/fraud/assess-order:
 *   post:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Order Fraud Risk Assessment
 *     description: Evaluates transaction Z-score, order velocity, and payment method risk.
 */
router.post('/fraud/assess-order', authenticateJWT, handleAssessOrderRisk);

/**
 * @openapi
 * /ai/fraud/flagged-orders:
 *   get:
 *     tags:
 *       - AI & Machine Learning
 *     summary: Audit Log of High-Risk Transactions
 *     description: Returns transactions with elevated risk scores for admin fraud operations.
 */
router.get('/fraud/flagged-orders', authenticateJWT, authorizeRoles('admin', 'super_admin', 'finance', 'auditor'), handleGetFraudAuditList);

export default router;
