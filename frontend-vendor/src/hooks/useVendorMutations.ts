import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/services/VendorServices";
import type { ProfileSetupRequest, KYCInfoRequest } from "@/types/api";

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
    mutationFn: () => vendorService.submitKYCForReview(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
    },
  });
}
