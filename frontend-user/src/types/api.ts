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

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}