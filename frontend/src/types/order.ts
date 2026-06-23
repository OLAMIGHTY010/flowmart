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
  productName?: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  qty: number;
  quantity?: number;
  price: string;
  unitPrice?: string;
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
  updatedAt?: string;
  customerName?: string;
  customerPhone?: string;
  distance?: string;
  estimatedTime?: string;
  packsCount?: number;
}
