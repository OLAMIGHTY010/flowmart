// stores/checkoutStore.ts

import { create } from "zustand";

export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "cash_on_delivery";

interface CheckoutStore {
  couponCode: string;

  selectedAddress: string | null;

  selectedPaymentMethod: PaymentMethod;

  setCouponCode: (
    code: string
  ) => void;

  setSelectedAddress: (
    addressId: string
  ) => void;

  setPaymentMethod: (
    method: PaymentMethod
  ) => void;

  resetCheckout: () => void;
}

export const useCheckoutStore =
  create<CheckoutStore>((set) => ({
    couponCode: "",

    selectedAddress: null,

    selectedPaymentMethod:
      "cash_on_delivery",

    setCouponCode: (code) =>
      set({
        couponCode: code,
      }),

    setSelectedAddress: (id) =>
      set({
        selectedAddress: id,
      }),

    setPaymentMethod: (method) =>
      set({
        selectedPaymentMethod:
          method,
      }),

    resetCheckout: () =>
      set({
        couponCode: "",
        selectedAddress: null,
        selectedPaymentMethod:
          "cash_on_delivery",
      }),
  }));