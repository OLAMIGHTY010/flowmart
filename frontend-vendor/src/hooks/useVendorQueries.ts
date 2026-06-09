import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/services/VendorServices";

export function useKYCStatus(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["kycStatus"],
    queryFn: () => vendorService.getKYCStatus(),
    refetchInterval: options?.refetchInterval,
    staleTime: 5000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => vendorService.getDashboardStats(),
    staleTime: 30000, // 30 seconds cache fresh time
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["vendorOrders"],
    queryFn: () => vendorService.getOrders(),
    staleTime: 10000, // 10 seconds cache fresh time
  });
}
