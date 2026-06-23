import { create } from "zustand";
import type { Product } from "@/types/product";

interface RecommendationStore {
  recommendations: Product[];

  setRecommendations: (
    products: Product[]
  ) => void;

  clearRecommendations: () => void;
}

export const useRecommendationStore =
  create<RecommendationStore>((set) => ({
    recommendations: [],

    setRecommendations: (products) =>
      set({
        recommendations: products,
      }),

    clearRecommendations: () =>
      set({
        recommendations: [],
      }),
  }));