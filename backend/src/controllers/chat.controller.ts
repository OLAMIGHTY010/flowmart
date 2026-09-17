import { Request, Response } from "express";
import { db } from "../../db";
import { conversations, messages, users, products } from "../../db/schema";
import { eq, or, and, sql, desc, asc } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Create or Get Conversation
export const createOrGetConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const buyerId = req.user?.id;
    const { productId, vendorId } = req.body;

    if (!buyerId || !productId || !vendorId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (buyerId === vendorId) {
      return res.status(400).json({ success: false, message: "Cannot chat with yourself" });
    }

    // Check if conversation exists
    let [conversation] = await db.select()
      .from(conversations)
      .where(
        and(
          eq(conversations.buyerId, buyerId),
          eq(conversations.productId, productId)
        )
      ).limit(1);

    if (!conversation) {
      const [newConvo] = await db.insert(conversations).values({
        buyerId,
        vendorId,
        productId
      }).returning();
      conversation = newConvo;
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error("Error in createOrGetConversation:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 2. Get User's Conversations
export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // We join the other party and the product
    const rawConversations = await db.select({
      conversation: conversations,
      productName: products.name,
      productImage: products.images,
      buyerName: users.fullName,
      buyerAvatar: users.avatar,
    })
      .from(conversations)
      .leftJoin(products, eq(conversations.productId, products.id))
      .leftJoin(users, eq(conversations.buyerId, users.id)) // To get buyer info (for vendor)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.vendorId, userId)))
      .orderBy(desc(conversations.updatedAt));

    // Wait, we need to map the "other party" depending on whether I'm buyer or vendor
    // This is simple enough for now. We can fetch vendorName in a separate query or join it.
    // Let's just return what we have, frontend can figure it out or we can refine it.
    
    // Better way: fetch both users
    const allUsers = await db.select({ id: users.id, fullName: users.fullName, avatar: users.avatar }).from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const mapped = rawConversations.map(c => {
      const otherUserId = c.conversation.buyerId === userId ? c.conversation.vendorId : c.conversation.buyerId;
      const otherUser = userMap.get(otherUserId);
      const isBuyer = c.conversation.buyerId === userId;
      return {
        ...c.conversation,
        productName: c.productName,
        productImage: Array.isArray(c.productImage) && c.productImage.length > 0 ? c.productImage[0] : null,
        otherUser,
        isBuyer
      };
    });

    return res.status(200).json({ success: true, conversations: mapped });
  } catch (error) {
    console.error("Error in getConversations:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 3. Get Messages
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: conversationId } = req.params;
    
    const conversationMessages = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId as string))
      .orderBy(asc(messages.createdAt));

    return res.status(200).json({ success: true, messages: conversationMessages });
  } catch (error) {
    console.error("Error in getMessages:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 4. Send Message (Text or Offer)
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { id: conversationId } = req.params;
    const { content, isOffer, offerAmount } = req.body;

    if (!senderId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const [newMessage] = await db.insert(messages).values({
      conversationId: conversationId as string,
      senderId,
      content,
      isOffer: !!isOffer,
      offerAmount: isOffer ? offerAmount : null,
      offerStatus: isOffer ? 'pending' : null,
    }).returning();

    // Update conversation updatedAt
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId as string));

    return res.status(200).json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 5. Accept or Reject Offer
export const respondToOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    const { id: messageId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const [offerMsg] = await db.select().from(messages).where(eq(messages.id, messageId as string)).limit(1);
    if (!offerMsg || !offerMsg.isOffer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    const [updatedMsg] = await db.update(messages)
      .set({ offerStatus: newStatus as any })
      .where(eq(messages.id, messageId as string))
      .returning();

    return res.status(200).json({ success: true, message: updatedMsg });
  } catch (error) {
    console.error("Error in respondToOffer:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
