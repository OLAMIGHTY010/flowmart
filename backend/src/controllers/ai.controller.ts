import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../../db';
import { products } from '../../db/schema';
import { ilike, or } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Helper function that tries Gemini first, then falls back to OpenAI
async function generateAIContent(systemPrompt: string, userContent: string): Promise<string> {
  let text = "";
  let lastError = "";
  
  try {
    // Try Gemini First
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const response = await model.generateContent(`${systemPrompt}\n\n${userContent}`);
        text = response.response.text() || "";
        if (text) return text;
      } catch (err1: any) {
        console.warn("gemini-1.5-flash-latest failed, trying gemini-pro", err1.message);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(`${systemPrompt}\n\n${userContent}`);
        text = response.response.text() || "";
        if (text) return text;
      }
    }
  } catch (err: any) {
    console.warn("Gemini generation failed, falling back to OpenAI...", err);
    lastError = "Gemini Error: " + err.message;
  }

  try {
    // Fallback to OpenAI ChatGPT
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ]
      });
      text = completion.choices[0]?.message?.content || "";
    }
  } catch (err: any) {
    console.error("OpenAI generation also failed!", err);
    lastError += " | OpenAI Error: " + err.message;
  }

  return text || `DEBUG_ERROR: ${lastError}`;
}

export const processShoppingQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Message history is required' });
    }

    const latestMessage = messages[messages.length - 1].content;
    const conversationText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

    // Step 1: Use AI to extract search parameters
    const extractPrompt = `You are an intent extractor for an e-commerce platform called FlowMart.
The user is talking to a shopping assistant.
Based on the conversation history, extract search keywords for the database query.
Output ONLY a valid JSON object with the following schema, nothing else (no markdown, no backticks):
{
  "keywords": ["list", "of", "search", "terms"]
}`;
    
    let searchParams = { keywords: [] as string[] };
    try {
      const text = await generateAIContent(extractPrompt, `Conversation:\n${conversationText}`);
      const cleaned = (text || "{}").replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      searchParams = JSON.parse(cleaned);
    } catch (e) {
      console.warn("Failed to extract intent, falling back to simple split", e);
      searchParams.keywords = latestMessage.toLowerCase().split(' ').filter((w: string) => w.length > 3);
    }

    // Step 2: Query the Database
    let recommendedProducts: any[] = [];
    if (searchParams.keywords && searchParams.keywords.length > 0) {
      const searchConditions = searchParams.keywords.map((kw: string) => 
        or(ilike(products.name, `%${kw}%`), ilike(products.description, `%${kw}%`))
      );
      
      recommendedProducts = await db.select().from(products)
        .where(or(...searchConditions))
        .limit(5);
    }

    // Step 3: Use AI to generate a conversational reply
    const replyPrompt = `You are FlowMart's helpful AI shopping assistant.
Respond to the user's latest message in a friendly, concise, and helpful tone.
If products were found, mention them naturally and ask if they'd like to add them to their cart.
If no products were found, apologize and ask for clarification.
Database results: ${JSON.stringify(recommendedProducts.map(p => ({ name: p.name, price: p.price, store: p.storeName })))}`;

    let finalReply = `I found some options based on your request.`;
    try {
      const text = await generateAIContent(replyPrompt, `Conversation history:\n${conversationText}`);
      if (text) finalReply = text;
    } catch (e) {
      console.error("Failed to generate conversational reply", e);
    }

    const aiResponse = {
      reply: finalReply,
      recommendations: recommendedProducts,
      suggestedActions: recommendedProducts.length > 0 ? ['Add All to Cart', 'Show Alternatives', 'Checkout'] : ['Search Again']
    };

    return res.status(200).json({ success: true, data: aiResponse });
  } catch (error) {
    console.error('processShoppingQuery Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
