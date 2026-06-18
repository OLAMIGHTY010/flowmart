import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/services/RiderServices";

export function useKYCStatus(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["kycStatus"],
    queryFn: () => riderService.getKYCStatus(),
    refetchInterval: options?.refetchInterval,
    staleTime: 5000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => riderService.getDashboardStats(),
    staleTime: 30000, // 30 seconds cache fresh time
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["riderOrders"],
    queryFn: () => riderService.getOrders(),
    staleTime: 10000, // 10 seconds cache fresh time
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["riderOrder", id],
    queryFn: () => riderService.getOrderById(id),
    enabled: !!id,
    staleTime: 5000,
  });
}


