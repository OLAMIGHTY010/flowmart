import { useMutation, useQueryClient } from "@tanstack/react-query";
import { riderService } from "@/services/RiderServices";
import type { ProfileSetupRequest, KYCInfoRequest, KYCSubmitPayload } from "@/types/api";

export function useProfileSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileSetupRequest) => riderService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useKYCInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KYCInfoRequest) => riderService.submitKYCInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
}

export function useKYCDocUpload() {
  return useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) =>
      riderService.uploadKYCDocument(docType, file),
  });
}

export function useKYCSubmit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KYCSubmitPayload) => riderService.submitKYCForReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      riderService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riderOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => riderService.acceptDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riderOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeclineDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => riderService.declineDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riderOrders"] });
    },
  });
}

export function useSubmitShortageReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => riderService.submitShortageReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["riderOrder", variables.id] });
    },
  });
}
