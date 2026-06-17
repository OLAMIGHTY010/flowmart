import { apiClient } from './api';

export interface AuditLogItem {
  id: string;
  eventId: string;
  actorId: string | null;
  actorName: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  status: string;
  metadata: any;
  createdAt: string;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const AuditLogServices = {
  getLogs: async (page: number, limit: number, search: string, filter: string, dateRange: string): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);
    if (dateRange) params.append('dateRange', dateRange);

    const res = await apiClient.get<AuditLogResponse>(`/admin/audit-logs?${params.toString()}`);
    return res as unknown as AuditLogResponse; // apiClient unwraps data automatically based on configuration, but typing is safer this way.
  },

  exportLogsUrl: (filter: string) => {
    // We return the URL so the frontend can just open it, 
    // or we can fetch it as a blob. Let's build the endpoint URL.
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    
    // In a real app, passing token in URL is not ideal, but for CSV download in browser it's a common trick 
    // Or we can do a blob download. Let's do a blob download method instead.
    return `/admin/audit-logs/export?${params.toString()}`;
  },
  
  downloadCsv: async (filter: string) => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    
    // apiClient will add Authorization header
    const response = await apiClient.get(`/admin/audit-logs/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response as any]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};
