import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/services/VendorServices";
import type { ProfileSetupRequest, KYCInfoRequest, KYCSubmitPayload } from "@/types/api";
import type { Product } from "@/types/product";

export function useProfileSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileSetupRequest) => vendorService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useKYCInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KYCInfoRequest) => vendorService.submitKYCInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
}

export function useKYCDocUpload() {
  return useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) =>
      vendorService.uploadKYCDocument(docType, file),
  });
}

export function useKYCSubmit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KYCSubmitPayload) => vendorService.submitKYCForReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Product) =>
      vendorService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorProducts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Product }) =>
      vendorService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorProducts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorProducts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
