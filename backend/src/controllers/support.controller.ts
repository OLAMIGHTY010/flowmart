import { Request, Response } from 'express';
import { db } from '../../db';
import { supportTickets, supportMessages, users } from '../../db/schema';
import { eq, and, desc, asc, count, getTableColumns } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SupportController {
  
  // 1. Initialize or get active ticket for a user
  static async getOrCreateTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Check if user already has an active ticket (bot_handling or escalated)
      let activeTickets = await db.select().from(supportTickets)
        .where(
          and(
            eq(supportTickets.userId, userId),
            eq(supportTickets.status, 'bot_handling') // Check escalated as well later, or just sort by recent
          )
        ).orderBy(desc(supportTickets.createdAt)).limit(1);
        
      if (activeTickets.length === 0) {
        activeTickets = await db.select().from(supportTickets)
          .where(
            and(
              eq(supportTickets.userId, userId),
              eq(supportTickets.status, 'escalated')
            )
          ).orderBy(desc(supportTickets.createdAt)).limit(1);
      }

      if (activeTickets.length > 0) {
        return res.json({ success: true, ticket: activeTickets[0] });
      }

      // Create new ticket
      const [newTicket] = await db.insert(supportTickets).values({
        userId,
        status: 'bot_handling',
      }).returning();

      // Initial bot greeting
      await db.insert(supportMessages).values({
        ticketId: newTicket.id,
        message: "Hello! I am FlowMart's virtual assistant. How can I help you today? (Type 'talk to agent' if you need a human)",
        isBot: true
      });

      return res.status(201).json({ success: true, ticket: newTicket });
    } catch (error: any) {
      console.error('getOrCreateTicket error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Fetch Chat History
  static async getTicketMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      
      const messages = await db.select().from(supportMessages)
        .where(eq(supportMessages.ticketId, ticketId as any))
        .orderBy(asc(supportMessages.createdAt));

      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. For Customer Service Agents: Get their assigned tickets
  static async getAssignedTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const agentId = req.user!.id;
      
      // Fetch tickets assigned to this agent that are escalated
      const tickets = await db.select({
        ...getTableColumns(supportTickets),
        userFullName: users.fullName,
        userEmail: users.email,
        userRole: users.role
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .where(
        and(
          eq(supportTickets.agentId, agentId),
          eq(supportTickets.status, 'escalated')
        )
      )
      .orderBy(desc(supportTickets.updatedAt));

      res.json({ success: true, tickets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. Resolve a Ticket
  static async resolveTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      
      const [updated] = await db.update(supportTickets)
        .set({ status: 'resolved', updatedAt: new Date() })
        .where(eq(supportTickets.id, ticketId as any))
        .returning();

      res.json({ success: true, ticket: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
