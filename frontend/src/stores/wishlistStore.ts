// stores/wishlistStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface WishlistStore {
  wishlist: Product[];

  addToWishlist: (
    product: Product
  ) => void;

  removeFromWishlist: (
    id: string
  ) => void;

  isWishlisted: (
    id: string
  ) => boolean;
}

export const useWishlistStore =
  create<WishlistStore>()(
    persist(
      (set, get) => ({
        wishlist: [],

        addToWishlist: (product) =>
          set((state) => ({
            wishlist: state.wishlist.some(
              (item) =>
                item.id === product.id
            )
              ? state.wishlist
              : [
                  ...state.wishlist,
                  product,
                ],
          })),

        removeFromWishlist: (id) =>
          set((state) => ({
            wishlist:
              state.wishlist.filter(
                (item) => item.id !== id
              ),
          })),

        isWishlisted: (id) =>
          get().wishlist.some(
            (item) => item.id === id
          ),
      }),
      {
        name: "wishlist-storage",
      }
    )
  );