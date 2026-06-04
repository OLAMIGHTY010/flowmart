export interface AppUser {
    id: string;
    username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AppUser {
    id: string;
    username: string;
    email: string;
    role: string;
    phone: string;
}

export type UserRole = 'vendor'

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: UserDTO;
  error?: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'editor';
  phone?: string;
  gender?: string;
  deleted?: boolean;
  avatar?: string;
  status?: string;
}
