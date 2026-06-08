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
