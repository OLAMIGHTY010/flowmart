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
  dob?: string;
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


export interface ProfileSetupRequest {
  displayName: string;
  businessName?: string;
  businessPhone?: string;
  phone?: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar?: string; // Base64 or URL
}

export interface DashboardStatsResponse {
  newOrders: number;
  inProgress: number;
  revenueToday: string;
  availableStock: number;
  weeklyRevenue: { day: string; h: number }[];
  totalRevenue: string;
  avgOrder: string;
  pendingTips?: string;
  deliveriesCount?: number;
  payouts?: { date: string; type: string; amount: string; status: string }[];
}

export interface KYCInfoRequest {
  vendorType?: string;
  fullName: string;
  dob: string;
  gender: string;
  businessName?: string;
  tin?: string;
  cacNo?: string;
  campCertificateId?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  vehicleType?: string;
  licenseNumber?: string;
  makeModel?: string;
  year?: string;
  plateNumber?: string;
  color?: string;
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
  businessName?: string;
  businessPhone?: string;
  phone?: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar?: string;

  // KYC Info fields
  vendorType?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  tin?: string;
  cacNo?: string;
  campCertificateId?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;

  // Vehicle details
  vehicleType?: string;
  makeModel?: string;
  year?: string;
  plateNumber?: string;
  color?: string;
  
  // KYC Submit fields
  govIdType: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  governmentIdFile?: string;
  campCertificateFile?: string;
  guarantorIdFile?: string;
  bankReferenceFile?: string;
  cacDocumentFile?: string;
  riderImageFile?: string;
  insuranceFile?: string;
  roadWorthinessFile?: string;
  carImageFile?: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}