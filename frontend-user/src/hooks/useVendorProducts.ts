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