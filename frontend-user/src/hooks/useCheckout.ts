import { useState } from "react";
import { paymentService } from "@/services/paymentService";
import { useCartStore } from "@/stores/cartStore";

export function useCheckout() {
  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const [loading, setLoading] =
    useState(false);

  const submitOrder = async (
    payload: FormData
  ) => {
    try {
      setLoading(true);

      const response =
        await paymentService.submitOrder(
          payload
        );

      clearCart();

      return response;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitOrder,
  };
}