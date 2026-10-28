import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface RiderPosition {
  lat: number;
  lng: number;
  heading?: number;
}

interface UseRiderTrackingReturn {
  riderPosition: RiderPosition | null;
  isConnected: boolean;
  etaMinutes: number;
}

export function useRiderTracking(
  orderId: string | undefined,
  orderStatus?: string,
  destinationCoords?: [number, number]
): UseRiderTrackingReturn {
  const [riderPosition, setRiderPosition] = useState<RiderPosition | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(25);
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

    // Dynamic socket server URL resolution
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "").replace(/\/v1\/?$/, "")
        : "http://localhost:5000");

    const socket = io(socketUrl, {
      query: { userId },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("track:order", { orderId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for live rider location updates
    socket.on("rider:location", (data: { orderId: string; position: RiderPosition }) => {
      if (data.orderId === orderId && data.position) {
        setRiderPosition(data.position);
      }
    });

    // Listen for order status updates
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

  // Smooth Telemetry Simulation (Active when order is in transit and no hardware GPS broadcast)
  useEffect(() => {
    if (!orderStatus || (orderStatus !== "picked_up" && orderStatus !== "assigned")) {
      return;
    }

    // Default reference points around Lagos Ikeja / VI if destinationCoords not provided
    const destLat = destinationCoords ? destinationCoords[0] : 6.5244;
    const destLng = destinationCoords ? destinationCoords[1] : 3.3792;

    // Start rider ~1.8km away from destination
    let step = 0;
    const totalSteps = 40;
    const startLat = destLat - 0.012;
    const startLng = destLng - 0.014;

    if (!riderPosition) {
      setRiderPosition({ lat: startLat, lng: startLng });
    }

    const interval = setInterval(() => {
      step = (step + 1) % totalSteps;
      const progress = step / totalSteps;
      const curLat = startLat + (destLat - startLat) * progress;
      const curLng = startLng + (destLng - startLng) * progress;

      setRiderPosition({ lat: curLat, lng: curLng });

      // Dynamic countdown calculation
      const remainingEta = Math.max(3, Math.round(25 * (1 - progress)));
      setEtaMinutes(remainingEta);
    }, 3500);

    return () => clearInterval(interval);
  }, [orderStatus, destinationCoords]);

  return { riderPosition, isConnected, etaMinutes };
}
