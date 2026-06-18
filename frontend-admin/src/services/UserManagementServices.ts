import { apiClient } from './api';

export interface UserStats {
  totalUsers: number;
  newThisMonth: number;
  pendingApprovals: number;
  suspendedAccounts: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin: string | null;
  createdAt: string;
}

export interface PaginatedUsers {
  data: User[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export const UserManagementServices = {
  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<{ success: boolean, stats: UserStats }>('/user-management/stats');
    return response.stats;
  },

  getUsers: async (page = 1, limit = 10, role = 'all', status = 'all', search = ''): Promise<PaginatedUsers> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      role,
      status,
      search
    });
    const response = await apiClient.get<{ success: boolean, data: User[], meta: any }>(`/user-management?${params.toString()}`);
    return { data: response.data, meta: response.meta };
  },

  createUser: async (userData: { fullName: string, email: string, role: string, phone?: string, dateOfBirth?: string, gender?: string, password?: string }): Promise<{success: boolean, message: string, tempPassword?: string}> => {
    const response = await apiClient.post<{ success: boolean, message: string, tempPassword?: string }>('/user-management', userData);
    return response;
  },

  updateStatus: async (id: string, status: 'active' | 'suspended' | 'deleted'): Promise<{success: boolean, message: string}> => {
    const response = await apiClient.patch<{ success: boolean, message: string }>(`/user-management/${id}/status`, { status });
    return response;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<{success: boolean, message: string}> => {
    const response = await apiClient.put<{ success: boolean, message: string }>(`/user-management/${id}`, updates);
    return response;
  }
};
