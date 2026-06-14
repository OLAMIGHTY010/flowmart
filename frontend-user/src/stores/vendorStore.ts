import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VendorState {
  followedVendors: string[]; // Array of vendor IDs
  followVendor: (vendorId: string) => void;
  unfollowVendor: (vendorId: string) => void;
  isFollowing: (vendorId: string) => boolean;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      followedVendors: [],
      followVendor: (vendorId) =>
        set((state) => ({
          followedVendors: [...new Set([...state.followedVendors, vendorId])],
        })),
      unfollowVendor: (vendorId) =>
        set((state) => ({
          followedVendors: state.followedVendors.filter((id) => id !== vendorId),
        })),
      isFollowing: (vendorId) => get().followedVendors.includes(vendorId),
    }),
    {
      name: "flowmart-vendor-storage",
    }
  )
);
