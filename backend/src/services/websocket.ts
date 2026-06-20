import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from '../../db';
import { supportTickets, supportMessages, users } from '../../db/schema';
import { eq, asc, and } from 'drizzle-orm';

const connectedUsers = new Map<string, string>();
let io: Server;

export const initWebSocketHub = (server: HttpServer) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected.`);
    }

    socket.on('track:order', ({ orderId }: { orderId: string }) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined room order:${orderId}`);
    });

    socket.on('track:leave', ({ orderId }: { orderId: string }) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('support:join', ({ ticketId }: { ticketId: string }) => {
      socket.join(`ticket:${ticketId}`);
      console.log(`Socket ${socket.id} joined support ticket:${ticketId}`);
    });

    socket.on('support:message', async (data: { ticketId: string; senderId: string; message: string; isBot?: boolean }) => {
      try {
        const { ticketId, senderId, message, isBot = false } = data;
        
        // Save user message
        const [newMessage] = await db.insert(supportMessages).values({
          ticketId,
          senderId: isBot ? null : senderId,
          message,
          isBot
        }).returning();

        // Broadcast to ticket room
        io.to(`ticket:${ticketId}`).emit('support:message', newMessage);

        if (!isBot) {
          // Check ticket status
          const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
          
          if (ticket && ticket.status === 'bot_handling') {
            const lowerMsg = message.toLowerCase();
            // Basic Escalation detection
            if (lowerMsg.includes('agent') || lowerMsg.includes('human') || lowerMsg.includes('representative')) {
              
              // 🤖 ESCALATE LOGIC: Auto-assign logic based on Least Active Tickets
              // 1. Find all customer_service agents
              const agents = await db.select({ id: users.id }).from(users).where(eq(users.role, 'customer_service'));
              
              let assignedAgentId = null;

              if (agents.length > 0) {
                // 2. Count active tickets per agent to find the least busy one
                // For simplicity, we just assign to the first one or we can query counts
                // Let's do a simple count per agent
                let leastBusyAgent = agents[0].id;
                let minTickets = Infinity;

                for (const agent of agents) {
                  const agentTickets = await db.select().from(supportTickets)
                    .where(and(eq(supportTickets.agentId, agent.id), eq(supportTickets.status, 'escalated')));
                  if (agentTickets.length < minTickets) {
                    minTickets = agentTickets.length;
                    leastBusyAgent = agent.id;
                  }
                }
                assignedAgentId = leastBusyAgent;
              }

              await db.update(supportTickets).set({ 
                status: 'escalated', 
                agentId: assignedAgentId,
                updatedAt: new Date() 
              }).where(eq(supportTickets.id, ticketId));
              
              const [escalationMsg] = await db.insert(supportMessages).values({
                ticketId,
                message: "I understand you want to speak with a human. I have transferred your chat to our Customer Service team. An agent will be with you shortly.",
                isBot: true
              }).returning();
              
              io.to(`ticket:${ticketId}`).emit('support:message', escalationMsg);
              
              if (assignedAgentId) {
                io.emit('support:assigned', { ticketId, agentId: assignedAgentId });
              } else {
                io.emit('support:escalated', ticketId); // Alert all agents if none assigned
              }

            } else {
              // 🤖 LLM MOCK LOGIC: In a real integration, we'd pass the chat history to OpenAI here
              const botReply = `I am a virtual assistant. You said: "${message}". Is there anything specific you need help with? Type "talk to agent" if you want human assistance.`;
              
              setTimeout(async () => {
                const [botMsg] = await db.insert(supportMessages).values({
                  ticketId,
                  message: botReply,
                  isBot: true
                }).returning();
                io.to(`ticket:${ticketId}`).emit('support:message', botMsg);
              }, 1000);
            }
          }
        }

      } catch (err) {
        console.error('Socket support:message error:', err);
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected.`);
      }
    });
  });
};

export const sendInAppNotification = (userId: string, event: string, payload: any) => {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, payload);
  }
};

export const emitRiderLocation = (orderId: string, position: { lat: number; lng: number }) => {
  if (io) {
    io.to(`order:${orderId}`).emit('rider:location', { orderId, position });
  }
};

export const emitOrderStatusUpdate = (orderId: string, status: string) => {
  if (io) {
    io.to(`order:${orderId}`).emit('order:statusUpdate', { orderId, status });
  }
};

export const getIO = () => io;
