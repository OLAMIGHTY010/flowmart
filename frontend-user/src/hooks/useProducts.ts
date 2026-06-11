import { useQuery } from "@tanstack/react-query";
import { productServices } from "@/services/ProductServices";

export const useProducts = () => {
    return useQuery({
        queryKey: ["products"],
        queryFn: async () => await productServices.getProducts(),
    })
}