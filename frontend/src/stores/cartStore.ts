import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface CartItem extends Product {
  qty: number;
  imageUrl: string;
}

interface CartStore {
  cart: CartItem[];
  

  addToCart: (product: Product, quantity?: number) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  getCartCount: () => number;
  getCartSubtotal: () => number;
  getShippingFee: () => number;
  getCartTotal: () => number;
}

// helper
const calculateTotals = (cart: CartItem[]) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0
  );

  // Shipping fee is now calculated dynamically during checkout based on the zone
  // We set it to 0 here to prevent mismatches between Cart and Checkout
  const shippingFee = 0;

  return {
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product, qty = 1) =>
        set((state) => {
          const exists = state.cart.find(
            (item) => item.id === product.id
          );

          const cart = exists
            ? state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, qty: item.qty + qty }
                  : item
              )
            : [...state.cart, { ...product as any, qty }];

          return { cart };
        }),

      increaseQty: (id) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        })),

      decreaseQty: (id) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.id === id
                ? { ...item, qty: item.qty - 1 }
                : item
            )
            .filter((item) => item.qty > 0),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),

      getCartCount: () =>
        get().cart.reduce((sum, item) => sum + item.qty, 0),

      getCartSubtotal: () => {
        const { subtotal } = calculateTotals(get().cart);
        return subtotal;
      },

      getShippingFee: () => {
        const { shippingFee } = calculateTotals(get().cart);
        return shippingFee;
      },

      getCartTotal: () => {
        const { total } = calculateTotals(get().cart);
        return total;
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
