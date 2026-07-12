import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../../db';
import { products } from '../../db/schema';
import { ilike, or } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const processShoppingQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Message history is required' });
    }

    const latestMessage = messages[messages.length - 1].content;

    // Step 1: Use Gemini to extract search parameters
    const extractPrompt = `
You are an intent extractor for an e-commerce platform called FlowMart.
The user is talking to a shopping assistant.
Based on the conversation history, extract search keywords for the database query.
Output ONLY a valid JSON object with the following schema, nothing else (no markdown, no backticks):
{
  "keywords": ["list", "of", "search", "terms"]
}
Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}
`;
    
    let searchParams = { keywords: [] as string[] };
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: extractPrompt
      });
      const text = response.text || "{}";
      const cleaned = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
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

    // Step 3: Use Gemini to generate a conversational reply
    const replyPrompt = `
You are FlowMart's helpful AI shopping assistant.
Respond to the user's latest message in a friendly, concise, and helpful tone.
If products were found, mention them naturally and ask if they'd like to add them to their cart.
If no products were found, apologize and ask for clarification.
Database results: ${JSON.stringify(recommendedProducts.map(p => ({ name: p.name, price: p.price, store: p.storeName })))}

Conversation history:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}
`;

    let finalReply = `I found some options based on your request.`;
    try {
      const replyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: replyPrompt
      });
      finalReply = replyResponse.text || finalReply;
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
