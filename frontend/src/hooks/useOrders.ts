import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderServices } from "@/services/OrderServices";

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: orderServices.getOrders,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => orderServices.getOrderById(id),
    enabled: !!id,
    refetchInterval: 10000, // Poll every 10s for status updates
  });
};

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => orderServices.placeOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useConfirmReceived = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderServices.confirmReceived(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
};
