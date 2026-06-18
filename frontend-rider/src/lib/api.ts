export type UserRole = "vendor" | "rider" | "admin" | "customer";

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
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  profileImage: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}