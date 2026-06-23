import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
  category?: string;
}

interface CartStore {
  cart: CartItem[];

  addToCart: (item: Omit<CartItem, "qty">, quantity?: number) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  getCartCount: () => number;
  getCartSubtotal: () => number;
  getShippingFee: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item, qty = 1) =>
        set((state) => {
          const exists = state.cart.find((c) => c.id === item.id);
          if (exists) {
            return {
              cart: state.cart.map((c) =>
                c.id === item.id ? { ...c, qty: c.qty + qty } : c
              ),
            };
          }
          return { cart: [...state.cart, { ...item, qty }] };
        }),

      increaseQty: (id) =>
        set((state) => ({
          cart: state.cart.map((c) =>
            c.id === id ? { ...c, qty: c.qty + 1 } : c
          ),
        })),

      decreaseQty: (id) =>
        set((state) => ({
          cart: state.cart
            .map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c))
            .filter((c) => c.qty > 0),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== id),
        })),

      clearCart: () => set({ cart: [] }),

      getCartCount: () =>
        get().cart.reduce((sum, item) => sum + item.qty, 0),

      getCartSubtotal: () =>
        get().cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0),

      getShippingFee: () => {
        const subtotal = get().cart.reduce(
          (sum, item) => sum + Number(item.price) * item.qty,
          0
        );
        return subtotal >= 50000 ? 0 : 2500;
      },

      getCartTotal: () => {
        const subtotal = get().getCartSubtotal();
        const shipping = get().getShippingFee();
        return subtotal + shipping;
      },
    }),
    {
      name: "flowmart-cart",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
