import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeOrders = (orderId?: string) => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    if (orderId) {
      socket.emit('track:order', { orderId });
    }

    const handleOrderStatusUpdate = (data: { orderId: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    };

    const handleEscrowStatusUpdate = (data: { escrowId: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['escrow', data.escrowId] });
    };

    socket.on('order:statusUpdate', handleOrderStatusUpdate);
    socket.on('escrow:statusUpdate', handleEscrowStatusUpdate);

    return () => {
      if (orderId) {
        socket.emit('track:leave', { orderId });
      }
      socket.off('order:statusUpdate', handleOrderStatusUpdate);
      socket.off('escrow:statusUpdate', handleEscrowStatusUpdate);
    };
  }, [socket, orderId, queryClient]);
};
