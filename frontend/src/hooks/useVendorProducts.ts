import { useQuery } from "@tanstack/react-query";
import { productServices } from "@/services/ProductServices";

export const useVendorProducts = (
  vendorId: string
) => {
  return useQuery({
    queryKey: [
      "vendor-products",
      vendorId,
    ],
    queryFn: async () =>
      await productServices.getVendorProducts(
        vendorId
      ),
    enabled: !!vendorId,
  });
};

export const useVendorProfile = (vendorId: string) => {
  return useQuery({
    queryKey: ["vendor-profile", vendorId],
    queryFn: async () => await productServices.getVendorProfile(vendorId),
    enabled: !!vendorId,
  });
};