import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../../db';
import { products, supportTickets, supportMessages } from '../../db/schema';
import { ilike, or, eq, and, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    "HTTP-Referer": "https://flowmart.com",
    "X-Title": "FlowMart",
  }
});

// Helper function that tries OpenRouter first, then Gemini, then OpenAI, then falls back to a beautiful dynamic response
async function generateAIContent(systemPrompt: string, userContent: string, isIntentParsing: boolean, recommendedProducts: any[] = []): Promise<string> {
  let text = "";
  
  try {
    // Try OpenRouter First
    if (process.env.OPENROUTER_API_KEY) {
      const completion = await openrouter.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ]
      });
      text = completion.choices[0]?.message?.content || "";
      if (text) return text;
    }
  } catch (err: any) {
    console.warn("OpenRouter generation failed, trying other fallbacks...", err.message);
  }
  
  try {
    // Try Gemini First
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const response = await model.generateContent(`${systemPrompt}\n\n${userContent}`);
        text = response.response.text() || "";
        if (text && !text.includes("404 Not Found")) return text;
      } catch (err1: any) {
        console.warn("gemini-1.5-flash-latest failed, trying gemini-pro", err1.message);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(`${systemPrompt}\n\n${userContent}`);
        text = response.response.text() || "";
        if (text && !text.includes("404 Not Found")) return text;
      }
    }
  } catch (err: any) {
    console.warn("Gemini generation failed, falling back to OpenAI...");
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
      if (text) return text;
    }
  } catch (err: any) {
    console.error("OpenAI generation also failed!");
  }

  // Final Fallback: If APIs fail due to quota/billing, provide a beautiful dynamic response
  if (isIntentParsing) {
    return ""; // Let the controller handle the keyword extraction fallback
  } else {
    // Dynamic Conversational Fallback
    if (recommendedProducts && recommendedProducts.length > 0) {
      const itemNames = recommendedProducts.map(p => p.name).join(", ");
      return `I found some fantastic options for you! We have ${itemNames} in stock. Would you like me to add any of these to your cart right now?`;
    } else {
      return `Hello! I'm your FlowMart virtual assistant. I couldn't find exact matches for that right now, but I'm here to help you find anything else you need. What are you looking for today?`;
    }
  }
}

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

Output ONLY a valid JSON object with the following schema:
{
  "shouldEscalate": true
}
or:
{
  "shouldEscalate": false
}`;
    
    let shouldEscalate = false;
    try {
      const classificationText = await generateAIContent(classificationPrompt, `Message:\n${latestMessage}`, true);
      const cleaned = (classificationText || "{}").replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleaned);
      shouldEscalate = !!parsed.shouldEscalate;
    } catch (e) {
      console.warn("Failed to parse classification sentiment:", e);
      const lowerMessage = latestMessage.toLowerCase();
      if (lowerMessage.includes("agent") || lowerMessage.includes("human") || lowerMessage.includes("representative") || lowerMessage.includes("person") || lowerMessage.includes("support")) {
        shouldEscalate = true;
      }
    }

    // Trigger Database Escalation if needed
    if (shouldEscalate && req.user?.id) {
      const activeTickets = await db.select().from(supportTickets)
        .where(
          and(
            eq(supportTickets.userId, req.user.id),
            eq(supportTickets.status, 'bot_handling')
          )
        ).orderBy(desc(supportTickets.createdAt)).limit(1);
        
      if (activeTickets.length > 0) {
        const ticketId = activeTickets[0].id;
        await db.update(supportTickets).set({
          status: 'escalated',
          updatedAt: new Date()
        }).where(eq(supportTickets.id, ticketId));
        
        await db.insert(supportMessages).values({
          ticketId,
          message: "I understand you need human assistance. I have transferred your chat to our Customer Service team. An agent will be with you shortly.",
          isBot: true
        });
      }
    }

    // Step 2: Semantic Product Search
    let recommendedProducts: any[] = [];
    try {
      // Fetch all products to perform semantic matching
      const allProducts = await db.select().from(products);
      
      const semanticPrompt = `You are a semantic search engine for the FlowMart e-commerce app.
Given a list of products and the user's latest query, select the top 5 most relevant products.
Evaluate products based on synonyms, dietary needs, culinary categories, or conceptual match (e.g. "dinner ideas" should suggest relevant meals).
User query: "${latestMessage}"
Products list: ${JSON.stringify(allProducts.map(p => ({ id: p.id, name: p.name, description: p.description, price: p.price })))}

Output ONLY a valid JSON object with the following schema (no markdown, no backticks, no other text):
{
  "matchedIds": ["list", "of", "matched", "product", "uuids"]
}`;
      
      const semanticResponse = await generateAIContent(semanticPrompt, `Query:\n${latestMessage}`, true);
      const cleaned = (semanticResponse || "{}").replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const matchedIds = parsed.matchedIds || [];
      
      if (matchedIds.length > 0) {
        recommendedProducts = allProducts.filter(p => matchedIds.includes(p.id)).slice(0, 5);
      }
    } catch (e) {
      console.warn("Failed to perform semantic search, falling back to keyword search", e);
    }

    // Keyword Search Fallback if semantic search returns no recommendations
    if (recommendedProducts.length === 0) {
      // Step 2b: Use AI to extract search keywords as fallback
      const extractPrompt = `You are an intent extractor for an e-commerce platform called FlowMart.
The user is talking to a shopping assistant.
Based on the conversation history, extract search keywords for the database query.
Output ONLY a valid JSON object with the following schema, nothing else (no markdown, no backticks):
{
  "keywords": ["list", "of", "search", "terms"]
}`;
      
      let searchParams = { keywords: [] as string[] };
      try {
        const text = await generateAIContent(extractPrompt, `Conversation:\n${conversationText}`, true);
        const cleaned = (text || "{}").replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        searchParams = JSON.parse(cleaned);
      } catch (e) {
        searchParams.keywords = latestMessage.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      }

      if (searchParams.keywords && searchParams.keywords.length > 0) {
        const searchConditions = searchParams.keywords.map((kw: string) => 
          or(ilike(products.name, `%${kw}%`), ilike(products.description, `%${kw}%`))
        );
        recommendedProducts = await db.select().from(products)
          .where(or(...searchConditions))
          .limit(5);
      }
    }

    // Step 3: Use AI to generate a conversational reply
    const replyPrompt = `You are FlowMart's helpful AI shopping assistant.
Respond to the user's latest message in a friendly, concise, and helpful tone.
If products were found, mention them naturally and ask if they'd like to add them to their cart.
If no products were found, apologize and ask for clarification.
Database results: ${JSON.stringify(recommendedProducts.map(p => ({ name: p.name, price: p.price })))}`;

    let finalReply = `I found some options based on your request.`;
    try {
      const text = await generateAIContent(replyPrompt, `Conversation history:\n${conversationText}`, false, recommendedProducts);
      if (text) finalReply = text;
    } catch (e) {
      console.error("Failed to generate conversational reply", e);
    }

    const aiResponse = {
      reply: shouldEscalate 
        ? "I understand you need human assistance. I have transferred your chat to our Customer Service team. An agent will be with you shortly."
        : finalReply,
      recommendations: shouldEscalate ? [] : recommendedProducts,
      suggestedActions: shouldEscalate 
        ? ['Waiting for agent...']
        : (recommendedProducts.length > 0 ? ['Add All to Cart', 'Show Alternatives', 'Checkout'] : ['Search Again']),
      shouldEscalate
    };

    return res.status(200).json({ success: true, data: aiResponse });

  } catch (error) {
    console.error('processShoppingQuery Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
