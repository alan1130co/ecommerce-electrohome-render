import { create } from "zustand";

import { apiClientFetch } from "@/lib/api-client";
import type { WishlistSummary } from "@/lib/types";

interface WishlistState {
  summary: WishlistSummary | null;
  loading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  summary: null,
  loading: false,
  error: null,

  fetchWishlist: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await apiClientFetch<WishlistSummary>("/api/wishlist/");
      set({ summary, loading: false });
    } catch (e) {
      // Si no hay sesión, se trata como wishlist vacía (no es un error visible).
      set({ summary: { total_items: 0, items: [] }, loading: false, error: e instanceof Error ? e.message : null });
    }
  },

  addItem: async (productId) => {
    await apiClientFetch(`/api/wishlist/${productId}/`, { method: "POST" });
    await get().fetchWishlist();
  },

  removeItem: async (productId) => {
    await apiClientFetch(`/api/wishlist/${productId}/`, { method: "DELETE" });
    await get().fetchWishlist();
  },

  isInWishlist: (productId) => {
    return get().summary?.items.some((item) => item.producto.id === productId) ?? false;
  },
}));
