import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./cartStore";

export type OrderStatus =
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "received";

export interface OrderTimeline {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  phone: string;
  zone: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: "bank_transfer" | "pay_on_delivery";
  transactionReference?: string;
  status: OrderStatus;
  timeline: OrderTimeline[];
  createdAt: string;
}

interface OrderStore {
  orders: Order[];
  currentOrderId: string | null;

  addOrder: (order: Order) => void;
  setCurrentOrderId: (id: string | null) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrderById: (id: string) => Order | undefined;
  markAsReceived: (id: string) => void;
}

function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OR${num}`;
}

export function buildInitialTimeline(
  paymentMethod: "bank_transfer" | "pay_on_delivery"
): OrderTimeline[] {
  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const baseStatus: OrderStatus =
    paymentMethod === "bank_transfer"
      ? "awaiting_payment"
      : "awaiting_confirmation";

  return [
    { status: "awaiting_payment", label: "Order Placed", timestamp: now },
    { status: "awaiting_confirmation", label: "Payment Confirmed", timestamp: baseStatus === "awaiting_confirmation" ? now : null },
    { status: "confirmed", label: "Order Confirmed", timestamp: null },
    { status: "assigned", label: "Assigned to Rider", timestamp: null },
    { status: "picked_up", label: "Picked Up", timestamp: null },
    { status: "out_for_delivery", label: "Out for Delivery", timestamp: null },
    { status: "delivered", label: "Delivered", timestamp: null },
    { status: "received", label: "Order Received", timestamp: null },
  ];
}

export { generateOrderId };

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrderId: null,

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
          currentOrderId: order.id,
        })),

      setCurrentOrderId: (id) =>
        set({ currentOrderId: id }),

      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== id) return order;

            const now = new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusOrder: OrderStatus[] = [
              "awaiting_payment",
              "awaiting_confirmation",
              "confirmed",
              "assigned",
              "picked_up",
              "out_for_delivery",
              "delivered",
              "received",
            ];

            const targetIdx = statusOrder.indexOf(status);

            const updatedTimeline = order.timeline.map((entry, i) => {
              if (i <= targetIdx && !entry.timestamp) {
                return { ...entry, timestamp: now };
              }
              return entry;
            });

            return {
              ...order,
              status,
              timeline: updatedTimeline,
            };
          }),
        })),

      getOrderById: (id) =>
        get().orders.find((o) => o.id === id),

      markAsReceived: (id) => {
        get().updateOrderStatus(id, "received");
      },
    }),
    {
      name: "order-storage",
    }
  )
);
