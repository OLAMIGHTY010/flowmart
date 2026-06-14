
import { useQuery } from "@tanstack/react-query";
import { productServices } from "@/services/ProductServices";

export const useProduct = (
  productId: string
) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response =
        await productServices.getProductById(
          productId
        );

      return response;
    },
    enabled: !!productId,
  });
};