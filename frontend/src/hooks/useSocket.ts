import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        query: { userId: user.id },
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  return socketRef.current;
};
