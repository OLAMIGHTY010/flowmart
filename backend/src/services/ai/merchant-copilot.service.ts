/**
 * ============================================================================
 * MERCHANT AI COPILOT & PRICING ADVISOR SERVICE
 * ============================================================================
 *
 * Provides:
 * 1. AI Product Listing Generator (SEO titles, descriptions, category tagging)
 * 2. Statistical Category Pricing Intelligence (IQR, median, optimal price tiers)
 *
 * @module backend/src/services/ai/merchant-copilot.service
 */

import { db } from '../../../db';
import { products, categories } from '../../../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { executeAIGeneration, extractJsonFromResponse } from './ai-provider.service';

export interface GenerateListingInput {
  title: string;
  category?: string;
  roughNotes?: string;
  brand?: string;
  condition?: string;
  productType?: string;
}

export interface GeneratedListingOutput {
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

export interface PricingAdviceOutput {
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

/**
 * Generates an optimized, high-converting product listing
 */
export async function generateProductListing(
  input: GenerateListingInput
): Promise<GeneratedListingOutput> {
  const fallbackOutput: GeneratedListingOutput = {
    optimizedTitle: input.title.trim(),
    description: input.roughNotes
      ? `${input.roughNotes}\n\nHigh quality product available with fast delivery on FlowMart.`
      : `Premium ${input.title}. Guaranteed quality and fast delivery across Nigeria.`,
    bulletHighlights: [
      'High durability and verified quality',
      'Fast doorstep delivery via FlowMart Express',
      'Eligible for FlowMart Escrow buyer protection',
    ],
    suggestedCategory: input.category || 'Retail',
    seoTags: input.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
    suggestedPriceRange: { min: 2500, max: 15000, currency: 'NGN' },
  };

  const systemPrompt = `You are an expert e-commerce copywriter and SEO specialist for FlowMart, Nigeria's leading everyday super app.
A merchant wants to create a new product listing. Given their rough input, create a polished, attractive, high-converting product listing.
Ensure tone is professional, appealing to Nigerian consumers (referencing reliable delivery, Escrow buyer protection, quality guarantee).
Output ONLY valid JSON matching this schema:
{
  "optimizedTitle": "Compelling Title with Brand and Key Spec",
  "description": "2-3 paragraphs highlighting benefits, specifications, and authenticity",
  "bulletHighlights": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "suggestedCategory": "Category Name",
  "seoTags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "suggestedPriceRange": {
    "min": number,
    "max": number,
    "currency": "NGN"
  }
}`;

  const userPrompt = `Product input:
Title: ${input.title}
Category: ${input.category || 'Not specified'}
Brand: ${input.brand || 'Unbranded'}
Condition: ${input.condition || 'New'}
Product Type: ${input.productType || 'Retail'}
Rough Details: ${input.roughNotes || 'Standard product'}`;

  try {
    const rawResponse = await executeAIGeneration({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      expectJson: true,
    });

    if (rawResponse) {
      const parsed = extractJsonFromResponse<GeneratedListingOutput>(rawResponse, fallbackOutput);
      if (parsed && parsed.optimizedTitle && Array.isArray(parsed.bulletHighlights)) {
        return parsed;
      }
    }
  } catch (e) {
    // Return fallback
  }

  return fallbackOutput;
}

/**
 * Calculates statistical pricing intelligence for category competitors
 */
export async function getSmartPricingAdvice(
  categoryId?: string,
  currentPrice?: number,
  productId?: string
): Promise<PricingAdviceOutput> {
  // Query peer products
  const peerQuery = db
    .select({ price: products.price })
    .from(products);

  const conditions: any[] = [];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (productId) conditions.push(ne(products.id, productId));

  const peerRows = conditions.length > 0
    ? await peerQuery.where(and(...conditions)).limit(100)
    : await peerQuery.limit(100);

  const prices = peerRows
    .map((r) => parseFloat(r.price))
    .filter((p) => !isNaN(p) && p > 0)
    .sort((a, b) => a - b);

  // Default values if no competitor data exists
  if (prices.length === 0) {
    const base = currentPrice && currentPrice > 0 ? currentPrice : 5000;
    return {
      currentPrice,
      sampleSize: 0,
      marketStats: {
        min: base * 0.8,
        q1: base * 0.9,
        median: base,
        q3: base * 1.1,
        max: base * 1.3,
        average: base,
      },
      recommendations: {
        competitivePrice: Math.round(base * 0.92),
        optimalPrice: Math.round(base),
        premiumPrice: Math.round(base * 1.15),
      },
      pricePositionSummary: 'First in class or limited competitor data in this category.',
      marginAdvice: 'Set price based on direct supplier cost + 25-35% target gross margin.',
    };
  }

  // Calculate quantiles
  const n = prices.length;
  const min = prices[0];
  const max = prices[n - 1];
  const median = prices[Math.floor(n / 2)];
  const q1 = prices[Math.floor(n * 0.25)];
  const q3 = prices[Math.floor(n * 0.75)];
  const sum = prices.reduce((acc, curr) => acc + curr, 0);
  const average = Number((sum / n).toFixed(2));

  // Determine pricing strategy recommendations
  const competitivePrice = Math.round(q1 * 0.98);
  const optimalPrice = Math.round(median);
  const premiumPrice = Math.round(q3 * 1.05);

  let pricePositionSummary = '';
  let marginAdvice = '';

  if (currentPrice) {
    if (currentPrice < q1) {
      pricePositionSummary = `Your price (₦${currentPrice.toLocaleString()}) is below the market 25th percentile. You offer an aggressive budget advantage.`;
      marginAdvice = 'You can safely increase prices by 5-10% to boost margin without losing volume.';
    } else if (currentPrice <= q3) {
      pricePositionSummary = `Your price (₦${currentPrice.toLocaleString()}) is comfortably within the middle 50% of the market (Median: ₦${median.toLocaleString()}).`;
      marginAdvice = 'Maintain current pricing or offer volume discounts (e.g., Buy 2 get 5% off) to increase Average Order Value.';
    } else {
      pricePositionSummary = `Your price (₦${currentPrice.toLocaleString()}) is in the premium tier above the 75th percentile (₦${q3.toLocaleString()}).`;
      marginAdvice = 'Ensure product imagery, verified badge, and warranty notes highlight premium value to sustain conversion rates.';
    }
  } else {
    pricePositionSummary = `Category prices range from ₦${min.toLocaleString()} to ₦${max.toLocaleString()} with median at ₦${median.toLocaleString()}.`;
    marginAdvice = `For fast traction, launch at ₦${competitivePrice.toLocaleString()}. For balanced margins, list at ₦${optimalPrice.toLocaleString()}.`;
  }

  return {
    currentPrice,
    sampleSize: n,
    marketStats: {
      min,
      q1,
      median,
      q3,
      max,
      average,
    },
    recommendations: {
      competitivePrice,
      optimalPrice,
      premiumPrice,
    },
    pricePositionSummary,
    marginAdvice,
  };
}
