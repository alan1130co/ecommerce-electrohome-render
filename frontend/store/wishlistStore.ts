import { create } from "zustand";

import { apiClientFetch } from "@/lib/api-client";
import type { WishlistSummary } from "@/lib/types";

interface WishlistState {
  summary: WishlistSummary | null;
  /** ids conocidos como "en la wishlist" — separado de `summary.items` para
   * poder responder isInWishlist() al instante (optimista) sin depender de
   * tener los datos completos del producto. */
  ids: Set<number>;
  loading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearAll: () => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

// WishlistBadge, MobileMenu y MobileBottomNav están montados a la vez
// (uno por breakpoint, ocultos con CSS, no desmontados) y cada uno llama
// fetchWishlist() en su propio efecto — sin deduplicar, un solo cambio de
// `user` dispara 3 peticiones idénticas en paralelo, y como cada una las
// dispara de nuevo al resolver `user`, se multiplica. Un fetch en vuelo
// compartido corta esto a una sola petición real.
let inFlightFetch: Promise<void> | null = null;

export const useWishlistStore = create<WishlistState>((set, get) => ({
  summary: null,
  ids: new Set(),
  loading: false,
  error: null,

  fetchWishlist: async () => {
    if (inFlightFetch) return inFlightFetch;
    inFlightFetch = (async () => {
      set({ loading: true, error: null });
      try {
        const summary = await apiClientFetch<WishlistSummary>("/api/wishlist/");
        set({ summary, ids: new Set(summary.items.map((i) => i.producto.id)), loading: false });
      } catch (e) {
        // Si no hay sesión, se trata como wishlist vacía (no es un error visible).
        set({
          summary: { total_items: 0, items: [] },
          ids: new Set(),
          loading: false,
          error: e instanceof Error ? e.message : null,
        });
      } finally {
        inFlightFetch = null;
      }
    })();
    return inFlightFetch;
  },

  // Optimista: el corazón y el contador cambian en el mismo tick del click,
  // antes de esperar la respuesta del servidor (que puede tardar varios
  // segundos por la latencia de Supabase). Si la petición falla, se revierte.
  addItem: async (productId) => {
    const prevSummary = get().summary;
    const prevIds = get().ids;
    set((s) => ({
      ids: new Set(s.ids).add(productId),
      summary: s.summary ? { ...s.summary, total_items: s.summary.total_items + 1 } : s.summary,
    }));
    try {
      await apiClientFetch(`/api/wishlist/${productId}/`, { method: "POST" });
    } catch (e) {
      set({ summary: prevSummary, ids: prevIds });
      throw e;
    }
  },

  removeItem: async (productId) => {
    const prevSummary = get().summary;
    const prevIds = get().ids;
    set((s) => {
      const ids = new Set(s.ids);
      ids.delete(productId);
      return {
        ids,
        summary: s.summary
          ? {
              total_items: Math.max(0, s.summary.total_items - 1),
              items: s.summary.items.filter((i) => i.producto.id !== productId),
            }
          : s.summary,
      };
    });
    try {
      await apiClientFetch(`/api/wishlist/${productId}/`, { method: "DELETE" });
    } catch (e) {
      set({ summary: prevSummary, ids: prevIds });
      throw e;
    }
  },

  // No hay endpoint de "vaciar todo" en el backend — se borra ítem por
  // ítem en paralelo (no hay límite de tamaño realista para una wishlist).
  clearAll: async () => {
    const prevSummary = get().summary;
    const prevIds = get().ids;
    const items = prevSummary?.items ?? [];
    set({ summary: { total_items: 0, items: [] }, ids: new Set() });
    try {
      await Promise.all(items.map((item) => apiClientFetch(`/api/wishlist/${item.producto.id}/`, { method: "DELETE" })));
    } catch (e) {
      set({ summary: prevSummary, ids: prevIds });
      throw e;
    }
  },

  isInWishlist: (productId) => get().ids.has(productId),
}));
