/**
 * ============================================================================
 * SMART SEMANTIC SEARCH & NLP QUERY PARSER SERVICE
 * ============================================================================
 *
 * Provides:
 * 1. Natural Language Query Intent Extraction (budget, category, diet, condition, keywords)
 * 2. Multi-Attribute Semantic SQL Matcher
 * 3. Query Relaxation & Auto-Suggestion when zero matches occur
 *
 * @module backend/src/services/ai/semantic-search.service
 */

import { db } from '../../../db';
import { products, categories, vendorProfiles } from '../../../db/schema';
import { ilike, or, and, lte, gte, eq } from 'drizzle-orm';
import { executeAIGeneration, extractJsonFromResponse } from './ai-provider.service';

export interface ParsedSearchIntent {
  rawQuery: string;
  keywords: string[];
  maxPrice?: number;
  minPrice?: number;
  productType?: 'food' | 'retail' | 'grocery' | 'service' | 'pharmacy' | 'real_estate' | 'vehicle';
  categoryHint?: string;
  dietaryTags?: string[];
  condition?: 'new' | 'used_like_new' | 'used_good' | 'used_fair';
  detectedIntent: 'product_search' | 'vendor_search' | 'price_check' | 'browse';
}

export interface SemanticSearchResult {
  query: string;
  parsedIntent: ParsedSearchIntent;
  products: any[];
  vendors: any[];
  totalMatches: number;
  relaxedQueryApplied?: boolean;
}

/**
 * Parses user search query with LLM or robust rule-based regex fallback
 */
export async function parseQueryIntent(rawQuery: string): Promise<ParsedSearchIntent> {
  const query = rawQuery.trim();

  // Rule-based fallback extraction
  const fallbackIntent: ParsedSearchIntent = {
    rawQuery: query,
    keywords: query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2),
    detectedIntent: 'product_search',
  };

  // Rule 1: Extract budget ("under 5000", "below 10k", "less than 20,000", "₦15000 max")
  const underPriceMatch = query.match(/(?:under|below|less than|max|up to)\s*(?:₦|n|ngn)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?/i);
  if (underPriceMatch) {
    let num = parseFloat(underPriceMatch[1].replace(/,/g, ''));
    if (underPriceMatch[2]?.toLowerCase() === 'k') num *= 1000;
    if (underPriceMatch[2]?.toLowerCase() === 'm') num *= 1000000;
    fallbackIntent.maxPrice = num;
  }

  // Rule 2: Condition check ("used", "second hand", "tokunbo", "brand new")
  if (/used|second hand|tokunbo/i.test(query)) {
    fallbackIntent.condition = 'used_good';
  } else if (/brand new|fresh|sealed/i.test(query)) {
    fallbackIntent.condition = 'new';
  }

  // Rule 3: Product type check
  if (/food|soup|rice|burger|pizza|shawarma|lunch|dinner/i.test(query)) {
    fallbackIntent.productType = 'food';
  } else if (/grocery|oil|garri|flour|tomato|yam|pepper/i.test(query)) {
    fallbackIntent.productType = 'grocery';
  } else if (/drug|medicine|pharmacy|syrup|capsule|paracetamol/i.test(query)) {
    fallbackIntent.productType = 'pharmacy';
  }

  // Try LLM Intent Parsing for nuanced linguistic understanding
  try {
    const systemPrompt = `You are an NLP search parser for FlowMart, Nigeria's premier commerce super app.
Extract search parameters from the user's natural query.
Return ONLY valid JSON with this exact schema:
{
  "keywords": ["clean", "search", "terms"],
  "maxPrice": number or null,
  "minPrice": number or null,
  "productType": "food" | "retail" | "grocery" | "service" | "pharmacy" | null,
  "categoryHint": string or null,
  "dietaryTags": ["tag1"] or [],
  "condition": "new" | "used_good" | null,
  "detectedIntent": "product_search" | "vendor_search"
}`;

    const rawResponse = await executeAIGeneration({
      systemPrompt,
      userPrompt: `User Query: "${query}"`,
      temperature: 0.1,
      expectJson: true,
    });

    if (rawResponse) {
      const parsed = extractJsonFromResponse<any>(rawResponse, null);
      if (parsed && Array.isArray(parsed.keywords)) {
        return {
          rawQuery: query,
          keywords: parsed.keywords.length > 0 ? parsed.keywords : fallbackIntent.keywords,
          maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : fallbackIntent.maxPrice,
          minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : fallbackIntent.minPrice,
          productType: parsed.productType || fallbackIntent.productType,
          categoryHint: parsed.categoryHint || fallbackIntent.categoryHint,
          dietaryTags: parsed.dietaryTags || [],
          condition: parsed.condition || fallbackIntent.condition,
          detectedIntent: parsed.detectedIntent || fallbackIntent.detectedIntent,
        };
      }
    }
  } catch (err) {
    // Fall back to rule-based intent
  }

  return fallbackIntent;
}

/**
 * Executes multi-dimensional semantic search
 */
export async function executeSemanticSearch(
  query: string,
  limit: number = 15
): Promise<SemanticSearchResult> {
  const intent = await parseQueryIntent(query);

  const conditions: any[] = [];

  // Keyword Matching across product name, description, and brand
  if (intent.keywords.length > 0) {
    const keywordFilters = intent.keywords.map((kw) =>
      or(
        ilike(products.name, `%${kw}%`),
        ilike(products.description, `%${kw}%`),
        ilike(products.brand, `%${kw}%`)
      )
    );
    conditions.push(or(...keywordFilters));
  } else {
    conditions.push(ilike(products.name, `%${query}%`));
  }

  // Budget Constraint
  if (intent.maxPrice !== undefined) {
    conditions.push(lte(products.price, intent.maxPrice.toString()));
  }
  if (intent.minPrice !== undefined) {
    conditions.push(gte(products.price, intent.minPrice.toString()));
  }

  // Product Type Filter
  if (intent.productType) {
    conditions.push(eq(products.productType, intent.productType));
  }

  let matchedProducts = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(limit);

  let relaxedQueryApplied = false;

  // Query Relaxation: If strict filter returns 0 products, relax price and type filters
  if (matchedProducts.length === 0 && (intent.maxPrice !== undefined || intent.productType !== undefined)) {
    const relaxedConditions = intent.keywords.map((kw) =>
      or(ilike(products.name, `%${kw}%`), ilike(products.description, `%${kw}%`))
    );

    matchedProducts = await db
      .select()
      .from(products)
      .where(or(...relaxedConditions))
      .limit(limit);

    relaxedQueryApplied = matchedProducts.length > 0;
  }

  // Also query matching vendors
  const matchedVendors = await db
    .select()
    .from(vendorProfiles)
    .where(
      or(
        ilike(vendorProfiles.businessName, `%${query}%`),
        ilike(vendorProfiles.displayName, `%${query}%`),
        ilike(vendorProfiles.city, `%${query}%`)
      )
    )
    .limit(5);

  return {
    query,
    parsedIntent: intent,
    products: matchedProducts,
    vendors: matchedVendors,
    totalMatches: matchedProducts.length + matchedVendors.length,
    relaxedQueryApplied,
  };
}
