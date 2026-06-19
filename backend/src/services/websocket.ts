import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

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
