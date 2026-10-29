import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface SelectedModifier {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique key distinguishing customized variations
  qty: number;
  imageUrl: string;
  selectedModifiers?: SelectedModifier[];
  specialInstructions?: string;
  unitPriceWithModifiers?: number;
}

interface CartStore {
  cart: CartItem[];

  addToCart: (product: Product, quantity?: number) => void;
  addToCartCustomized: (payload: {
    product: Product;
    quantity: number;
    selectedModifiers?: SelectedModifier[];
    specialInstructions?: string;
    unitPriceWithModifiers?: number;
  }) => void;
  increaseQty: (cartItemId: string) => void;
  decreaseQty: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  reorderItems: (items: any[]) => void;

  getCartCount: () => number;
  getCartSubtotal: () => number;
  getShippingFee: () => number;
  getCartTotal: () => number;
  getCartGroupedByVendor: () => Record<string, CartItem[]>;
}

// Helper to compute subtotal including customized modifier additions
const calculateTotals = (cart: CartItem[]) => {
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.unitPriceWithModifiers != null ? item.unitPriceWithModifiers : Number(item.price || 0);
    return sum + itemPrice * item.qty;
  }, 0);

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

      // Standard add to cart (default baseline)
      addToCart: (product, qty = 1) =>
        set((state) => {
          const cartItemId = product.id || String(Date.now());
          const exists = state.cart.find((item) => item.cartItemId === cartItemId);

          const cart = exists
            ? state.cart.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, qty: item.qty + qty }
                  : item
              )
            : [
                ...state.cart,
                {
                  ...(product as any),
                  cartItemId,
                  qty,
                  unitPriceWithModifiers: Number(product.price) || 0,
                },
              ];

          return { cart };
        }),

      // Chowdeck-Grade Customized Add to Cart
      addToCartCustomized: ({
        product,
        quantity = 1,
        selectedModifiers = [],
        specialInstructions = "",
        unitPriceWithModifiers,
      }) =>
        set((state) => {
          const modKey = selectedModifiers
            .map((m) => `${m.groupName}:${m.optionName}`)
            .sort()
            .join("|");
          const cartItemId = `${product.id || "item"}-${modKey}-${specialInstructions.substring(0, 10)}`;

          const exists = state.cart.find((item) => item.cartItemId === cartItemId);

          const cart = exists
            ? state.cart.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, qty: item.qty + quantity }
                  : item
              )
            : [
                ...state.cart,
                {
                  ...(product as any),
                  cartItemId,
                  qty: quantity,
                  selectedModifiers,
                  specialInstructions,
                  unitPriceWithModifiers: unitPriceWithModifiers || Number(product.price) || 0,
                },
              ];

          return { cart };
        }),

      // 1-Tap Quick Reorder: loads previous order items straight into cart
      reorderItems: (items: any[]) =>
        set((state) => {
          const newCartItems: CartItem[] = items.map((i) => {
            const pid = i.productId || i.id || `item-${Math.random().toString(36).substring(2, 7)}`;
            return {
              id: pid,
              cartItemId: pid,
              name: i.name || i.productName || "FlowMart Item",
              sku: i.sku || pid,
              description: "",
              price: Number(i.unitPrice || i.price || 0),
              unitPriceWithModifiers: Number(i.unitPrice || i.price || 0),
              stockQuantity: 99,
              imageUrl: i.imageUrl || i.productImage || "",
              qty: i.quantity || i.qty || 1,
            };
          });

          return { cart: newCartItems };
        }),

      increaseQty: (cartItemId) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.cartItemId === cartItemId || item.id === cartItemId
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        })),

      decreaseQty: (cartItemId) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.cartItemId === cartItemId || item.id === cartItemId
                ? { ...item, qty: item.qty - 1 }
                : item
            )
            .filter((item) => item.qty > 0),
        })),

      removeFromCart: (cartItemId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.cartItemId !== cartItemId && item.id !== cartItemId),
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

      getCartGroupedByVendor: () => {
        const grouped: Record<string, CartItem[]> = {};
        get().cart.forEach((item) => {
          const vId = item.vendorId || "Unknown Vendor";
          if (!grouped[vId]) {
            grouped[vId] = [];
          }
          grouped[vId].push(item);
        });
        return grouped;
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
