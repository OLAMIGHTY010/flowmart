import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface RiderPosition {
  lat: number;
  lng: number;
}

interface UseRiderTrackingReturn {
  riderPosition: RiderPosition | null;
  isConnected: boolean;
}

export function useRiderTracking(orderId: string | undefined): UseRiderTrackingReturn {
  const [riderPosition, setRiderPosition] = useState<RiderPosition | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const userId = (() => {
      try {
        const stored = localStorage.getItem("currentUser");
        return stored ? JSON.parse(stored).id : undefined;
      } catch {
        return undefined;
      }
    })();

    const socket = io("https://flowmart-backend-2s2d-o0ljo79px-gbotemiojos-projects.vercel.app", {
      query: { userId },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Join the order tracking room
      socket.emit("track:order", { orderId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for rider location updates
    socket.on("rider:location", (data: { orderId: string; position: RiderPosition }) => {
      if (data.orderId === orderId) {
        setRiderPosition(data.position);
      }
    });

    // Listen for order status updates — invalidate React Query cache
    socket.on("order:statusUpdate", (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    });

    return () => {
      socket.emit("track:leave", { orderId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, queryClient]);

  return { riderPosition, isConnected };
}
