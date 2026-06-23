export type UserRole = 'super_admin' | 'camp_logistics_coordinator' | 'zone_coordinator' | 'vendor' | 'dispatch_rider' | 'attendee';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  gender?: string;
  avatar?: string;
  status?: string;
  dateOfBirth?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
  forcePasswordChange?: boolean;
  twoFactorEnabled?: boolean;
  privacySettings?: {
    profileVisibility: boolean;
    showOnlineStatus: boolean;
    locationTracking: boolean;
  };
}

// UPDATED: Changed 'credential' to 'idToken' to match the backend
export interface GoogleAuthRequest {
  idToken: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AppUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CartItem {
  id: string;
  sku: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
}

export type PaymentMethod =
  | "bank_transfer"
  | "pay_on_delivery";

export interface CheckoutPayload {
  customer_name: string;
  phone: string;
  zone: string;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  payment_proof?: File | null;
}
