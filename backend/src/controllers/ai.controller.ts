/**
 * ============================================================================
 * UNIFIED AI & MACHINE LEARNING CONTROLLER
 * ============================================================================
 *
 * Exposes end-to-end AI/ML endpoints for FlowMart:
 * 1. Conversational Shopping Assistant (OpenRouter / Gemini / OpenAI cascade)
 * 2. Personalized & Collaborative Recommendation Engine
 * 3. Smart Semantic Search & NLP Query Parsing
 * 4. Merchant AI Copilot (Listing Generation & Dynamic Pricing Advisor)
 * 5. Predictive Demand Forecasting & Stockout Warning
 * 6. Customer Review Sentiment Intelligence & Digest
 * 7. Fraud & Anomaly Risk Scoring Engine
 *
 * @module backend/src/controllers/ai.controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../../db';
import { products, supportTickets, supportMessages } from '../../db/schema';
import { ilike, or, eq, and, desc } from 'drizzle-orm';
import { executeAIGeneration, extractJsonFromResponse } from '../services/ai/ai-provider.service';
import {
  getPersonalizedRecommendations,
  getFrequentlyBoughtTogether,
  getRelatedProducts,
} from '../services/ai/recommendation.service';
import { executeSemanticSearch } from '../services/ai/semantic-search.service';
import {
  generateProductListing,
  getSmartPricingAdvice,
} from '../services/ai/merchant-copilot.service';
import {
  forecastProductDemand,
  getInventoryHealthOverview,
} from '../services/ai/demand-forecasting.service';
import {
  calculateLexiconSentiment,
  summarizeProductReviews,
} from '../services/ai/sentiment-analysis.service';
import { assessOrderRisk, getAuditRiskOrders } from '../services/ai/fraud-detection.service';

/**
 * 1. Conversational Shopping Assistant & Intent Escalation
 */
export const processShoppingQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Message history is required' });
    }

    const latestMessage = messages[messages.length - 1].content;
    const conversationText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

    // Step 1: Sentiment & Support Routing (Escalation Check)
    const classificationPrompt = `Analyze the user's latest message for sentiment and intent.
Determine if the user is asking to speak to a human customer service agent, or if the user is expressing extreme frustration, anger, or urgency that warrants escalation to a human agent.
User message: "${latestMessage}"

Output ONLY a valid JSON object:
{ "shouldEscalate": true } or { "shouldEscalate": false }`;

    let shouldEscalate = false;
    try {
      const classificationText = await executeAIGeneration({
        systemPrompt: classificationPrompt,
        userPrompt: `Message:\n${latestMessage}`,
        temperature: 0.1,
        expectJson: true,
      });
      const parsed = extractJsonFromResponse<{ shouldEscalate?: boolean }>(classificationText, {});
      shouldEscalate = !!parsed.shouldEscalate;
    } catch (e) {
      const lower = latestMessage.toLowerCase();
      if (/agent|human|representative|person|support|escalate/i.test(lower)) {
        shouldEscalate = true;
      }
    }

    // Trigger Database Escalation if needed
    if (shouldEscalate && req.user?.id) {
      const activeTickets = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.userId, req.user.id),
            eq(supportTickets.status, 'bot_handling')
          )
        )
        .orderBy(desc(supportTickets.createdAt))
        .limit(1);

      if (activeTickets.length > 0) {
        const ticketId = activeTickets[0].id;
        await db
          .update(supportTickets)
          .set({ status: 'escalated' as any, updatedAt: new Date() })
          .where(eq(supportTickets.id, ticketId));

        await db.insert(supportMessages).values({
          ticketId,
          message:
            'I understand you need human assistance. I have transferred your chat to our Customer Service team. An agent will be with you shortly.',
          isBot: true,
        } as any);
      }
    }

    // Step 2: Semantic Product Search
    let recommendedProducts: any[] = [];
    try {
      const searchRes = await executeSemanticSearch(latestMessage, 5);
      recommendedProducts = searchRes.products;
    } catch (e) {
      console.warn('Semantic search fallback to keyword:', e);
      const keywords = latestMessage.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      if (keywords.length > 0) {
        const conditions = keywords.map((kw: string) =>
          or(ilike(products.name, `%${kw}%`), ilike(products.description, `%${kw}%`))
        );
        recommendedProducts = await db.select().from(products).where(or(...conditions)).limit(5);
      }
    }

    // Step 3: Conversational Reply Generation
    const replyPrompt = `You are FlowMart's helpful AI shopping assistant.
Respond to the user's latest message in a friendly, concise, and helpful tone.
If products were found, mention them naturally and ask if they'd like to add them to their cart.
If no products were found, apologize and ask for clarification.
Database results: ${JSON.stringify(recommendedProducts.map((p) => ({ name: p.name, price: p.price })))}`;

    let finalReply = recommendedProducts.length > 0
      ? `I found some great options for you: ${recommendedProducts.map((p) => p.name).join(', ')}. Would you like to add any to your cart?`
      : `Hello! I'm your FlowMart virtual assistant. How can I help you find what you need today?`;

    try {
      const text = await executeAIGeneration({
        systemPrompt: replyPrompt,
        userPrompt: `Conversation history:\n${conversationText}`,
        temperature: 0.5,
      });
      if (text) finalReply = text;
    } catch (e) {
      // Fallback response remains
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: shouldEscalate
          ? 'I understand you need human assistance. I have transferred your chat to our Customer Service team. An agent will be with you shortly.'
          : finalReply,
        recommendations: shouldEscalate ? [] : recommendedProducts,
        suggestedActions: shouldEscalate
          ? ['Waiting for agent...']
          : recommendedProducts.length > 0
          ? ['Add All to Cart', 'Show Alternatives', 'Checkout']
          : ['Search Again', 'Explore Categories'],
        shouldEscalate,
      },
    });
  } catch (error) {
    console.error('processShoppingQuery Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 2. Personalized Feed Recommendations
 */
export const getPersonalizedFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 8;
    const items = await getPersonalizedRecommendations(userId, limit);
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('getPersonalizedFeed Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 3. Frequently Bought Together (Bundle Recommendations)
 */
export const getFrequentlyBought = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const limit = parseInt(req.query.limit as string) || 3;
    const bundle = await getFrequentlyBoughtTogether(productId, limit);
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    console.error('getFrequentlyBought Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 4. Related Products
 */
export const getRelated = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const limit = parseInt(req.query.limit as string) || 6;
    const items = await getRelatedProducts(productId, limit);
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('getRelated Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 5. Smart Semantic Search
 */
export const handleSemanticSearch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = (req.query.q || req.query.query) as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }
    const limit = parseInt(req.query.limit as string) || 15;
    const result = await executeSemanticSearch(query, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('handleSemanticSearch Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 6. Merchant AI Product Listing Generator
 */
export const handleMerchantGenerateListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, roughNotes, brand, condition, productType } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }

    const listing = await generateProductListing({
      title,
      category,
      roughNotes,
      brand,
      condition,
      productType,
    });

    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error('handleMerchantGenerateListing Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 7. Merchant Smart Pricing Advisor
 */
export const handleMerchantPricingAdvisor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { categoryId, currentPrice, productId } = req.body;
    const parsedPrice = currentPrice ? parseFloat(currentPrice) : undefined;
    const advice = await getSmartPricingAdvice(categoryId, parsedPrice, productId);
    return res.status(200).json({ success: true, data: advice });
  } catch (error) {
    console.error('handleMerchantPricingAdvisor Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 8. Predictive Demand Forecast for Single Product
 */
export const handleProductDemandForecast = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const forecast = await forecastProductDemand(productId);
    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    console.error('handleProductDemandForecast Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 9. Vendor / Platform Inventory Health & Stockout Alerts
 */
export const handleInventoryHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // If merchant, filter by their vendorId; if admin, allow platform overview
    const vendorId = req.user?.role === 'vendor' ? req.user.id : (req.query.vendorId as string);
    const overview = await getInventoryHealthOverview(vendorId);
    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    console.error('handleInventoryHealth Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 10. Single Review Sentiment Analysis
 */
export const handleAnalyzeReviewSentiment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { comment, rating } = req.body;
    const result = calculateLexiconSentiment(comment || '', rating ? parseInt(rating) : undefined);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('handleAnalyzeReviewSentiment Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 11. Product Reviews AI Summary & Digest
 */
export const handleProductReviewSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const summary = await summarizeProductReviews(productId);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('handleProductReviewSummary Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 12. Transaction & Order Fraud Risk Assessment
 */
export const handleAssessOrderRisk = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { totalAmount, paymentMethod, deliveryZone, userId: bodyUserId } = req.body;
    const targetUserId = bodyUserId || req.user?.id;

    if (!targetUserId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'userId and totalAmount are required' });
    }

    const assessment = await assessOrderRisk({
      userId: targetUserId,
      totalAmount: parseFloat(totalAmount),
      paymentMethod: paymentMethod || 'paystack',
      deliveryZone,
      userIp: req.ip,
      deviceFingerprint: req.headers['x-device-fingerprint'] as string,
    });

    return res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    console.error('handleAssessOrderRisk Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * 13. Admin Flagged Fraud Audit List
 */
export const handleGetFraudAuditList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const flagged = await getAuditRiskOrders(limit);
    return res.status(200).json({ success: true, data: flagged });
  } catch (error) {
    console.error('handleGetFraudAuditList Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
