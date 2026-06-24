import { useQuery } from "@tanstack/react-query";
import { productServices } from "@/services/ProductServices";

export const useProductDetails = (id: string) => {
    return useQuery({
        queryKey: ["products", id],
        queryFn: async () => await productServices.getProductDetails(id),
        enabled: !!id,

    })
}