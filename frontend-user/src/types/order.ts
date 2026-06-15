export type OrderStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  category: string;
  qty: number;
  price: string;
}

export interface Order {
  id: string;
  attendeeId: string;
  vendorId: string;
  riderId?: string;
  deliveryZone: string;
  status: OrderStatus;
  totalAmount: string;
  deliveryPin?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
