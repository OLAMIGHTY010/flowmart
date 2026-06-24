// stores/recentlyViewedStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface RecentlyViewedStore {
  products: Product[];

  addViewedProduct: (
    product: Product
  ) => void;
}

export const useRecentlyViewedStore =
  create<RecentlyViewedStore>()(
    persist(
      (set) => ({
        products: [],

        addViewedProduct: (product) =>
          set((state) => {
            const filtered =
              state.products.filter(
                (p) =>
                  p.id !== product.id
              );

            return {
              products: [
                product,
                ...filtered,
              ].slice(0, 20),
            };
          }),
      }),
      {
        name: "recently-viewed-storage",
      }
    )
  );