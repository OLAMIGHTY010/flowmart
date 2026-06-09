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
  isVerified?: boolean;
  profileCompleted?: boolean;
}

export type GuardOptions = {
  requireAuth?: boolean;
  redirectTo?: string;
  requireProfile?: boolean;
  requireKYC?: boolean;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string; // Sometimes token is returned at root
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: AppUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AppUser;
}

export interface ProfileSetupRequest {
  displayName: string;
  businessPhone: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar?: string; // Base64 or URL
}

export interface KYCInfoRequest {
  fullName: string;
  dob: string;
  gender: string;
  bvn: string;
  businessName: string;
  cacNo: string;
  tin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface KYCStatusResponse {
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  referenceId: string;
  steps: {
    label: string;
    time: string;
    status: 'done' | 'active' | 'pending';
  }[];
}

export interface DashboardStatsResponse {
  newOrders: number;
  inProgress: number;
  revenueToday: string;
  availableStock: number;
  weeklyRevenue: { day: string; h: number }[];
  totalRevenue: string;
  avgOrder: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface Order {
  id: string;
  attendeeId: string;
  vendorId: string;
  riderId?: string;
  deliveryZone: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  totalAmount: string;
  deliveryPin?: string;
  createdAt: string;
  items?: OrderItem[];
}

export type ToastType = "success" | "error";

export type ToastState = {
  message: string;
  type: ToastType;
}

export type ToastContextType = {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
}