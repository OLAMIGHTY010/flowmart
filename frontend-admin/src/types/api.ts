export type UserRole = 'super_admin' | 'admin' | 'camp_logistics_coordinator' | 'zone_coordinator' | 'finance' | 'auditor' | 'customer_service' | 'vendor' | 'dispatch_rider' | 'attendee';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: string;
  status?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
  forcePasswordChange?: boolean;
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
  gender: string;
  dateOfBirth: string;
  profileImage: string;
  phoneNumber: string;
  // country: string;
  // state: string;
  // city: string;
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
  businessName?: string;
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
  businessName: string;
  cacNo: string;
  campCertificateId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface KYCSubmitRequest {
  governmentIdType: 'national_id' | 'passport' | 'drivers_license';
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
}

export interface KYCSubmitPayload {
  // Profile Setup fields
  displayName: string;
  businessName: string;
  businessPhone: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar?: string;

  // KYC Info fields
  fullName?: string;
  dob?: string;
  gender?: string;
  cacNo?: string;
  campCertificateId?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  
  // KYC Submit fields
  govIdType: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  governmentIdFile?: string;
  campCertificateFile?: string;
  guarantorIdFile?: string;
}

export interface Product {
  id?: string;
  vendorId?: string;
  sku?: string;
  name: string;
  description?: string;
  price: string | number;
  oldPrice?: string | number;
  stockQuantity: number;
  imageUrl: string;
  images?: string | string[];
  category?: string;
  brand?: string;
  weight?: string | number;
}

export interface KYCStatusResponse {
  status: 'unsubmitted' | 'pending' | 'under_review' | 'approved' | 'rejected';
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