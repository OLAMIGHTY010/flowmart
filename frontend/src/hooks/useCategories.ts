import { useQuery } from "@tanstack/react-query";
import { coreServices } from "@/services/CoreServices";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: coreServices.getCategories,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — categories don't change often
  });
};
