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

export interface RiderProfile {
  name: string;
  phone: string;
  vehicle: string;
  rating: string;
  deliveriesCompleted: number;
  avatar?: string | null;
}

export interface Order {
  id: string;
  orderRef?: string;
  userId: string;
  vendorId: string;
  riderId?: string;
  deliveryZone: string;
  deliveryAddress?: string;
  deliveryPostcode?: string;
  addressSource?: string;
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
  rider?: RiderProfile;
  riderInfo?: RiderProfile;
}
