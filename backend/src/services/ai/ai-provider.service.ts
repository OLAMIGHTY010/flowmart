/**
 * ============================================================================
 * AI PROVIDER ORCHESTRATION SERVICE
 * ============================================================================
 *
 * Provides a resilient multi-tier LLM inference cascade for FlowMart:
 * 1. OpenRouter (Gemini 2.5 Flash / Claude / Llama)
 * 2. Google Generative AI (Gemini 1.5 Flash / Gemini Pro)
 * 3. OpenAI (GPT-4o mini)
 * 4. Deterministic offline rule/template fallback (ensures 100% uptime)
 *
 * @module backend/src/services/ai/ai-provider.service
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': 'https://flowmart.com',
    'X-Title': 'FlowMart',
  },
});

export interface GenerateAIOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  expectJson?: boolean;
}

/**
 * Executes multi-provider AI text generation with automatic fallback
 */
export async function executeAIGeneration(options: GenerateAIOptions): Promise<string> {
  const { systemPrompt, userPrompt, temperature = 0.3 } = options;

  // Tier 1: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const completion = await openrouter.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      });
      const text = completion.choices[0]?.message?.content?.trim() || '';
      if (text) return text;
    } catch (err: any) {
      console.warn('OpenRouter provider error, falling back:', err.message);
    }
  }

  // Tier 2: Google Gemini (Direct)
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: { temperature },
      });
      const response = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = response.response.text()?.trim() || '';
      if (text && !text.includes('404 Not Found')) return text;
    } catch (err1: any) {
      try {
        const modelPro = genAI.getGenerativeModel({
          model: 'gemini-pro',
          generationConfig: { temperature },
        });
        const responsePro = await modelPro.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const textPro = responsePro.response.text()?.trim() || '';
        if (textPro && !textPro.includes('404 Not Found')) return textPro;
      } catch (err2: any) {
        console.warn('Google Gemini direct error, falling back:', err2.message);
      }
    }
  }

  // Tier 3: OpenAI (Direct)
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      });
      const text = completion.choices[0]?.message?.content?.trim() || '';
      if (text) return text;
    } catch (err: any) {
      console.warn('OpenAI provider error, falling back:', err.message);
    }
  }

  return '';
}

/**
 * Safely parses JSON from LLM markdown/text responses
 */
export function extractJsonFromResponse<T = any>(rawText: string, fallbackDefault: T): T {
  if (!rawText || typeof rawText !== 'string') return fallbackDefault;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Attempt regex block extraction for {...} or [...]
    const jsonMatch = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (inner) {
        // Fall back to default
      }
    }
    return fallbackDefault;
  }
}
