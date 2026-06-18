import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

const connectedUsers = new Map<string, string>();
let io: Server;

export const initWebSocketHub = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected.`);
    }

    // Allow clients to subscribe to order tracking rooms
    socket.on('track:order', ({ orderId }: { orderId: string }) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined room order:${orderId}`);
    });

    // Allow clients to leave order tracking rooms
    socket.on('track:leave', ({ orderId }: { orderId: string }) => {
      socket.leave(`order:${orderId}`);
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

// Emit rider location to all subscribers of an order room
export const emitRiderLocation = (orderId: string, position: { lat: number; lng: number }) => {
  if (io) {
    io.to(`order:${orderId}`).emit('rider:location', { orderId, position });
  }
};

// Emit order status update to all subscribers of an order room
export const emitOrderStatusUpdate = (orderId: string, status: string) => {
  if (io) {
    io.to(`order:${orderId}`).emit('order:statusUpdate', { orderId, status });
  }
};

// Get the io instance for external use
export const getIO = () => io;
