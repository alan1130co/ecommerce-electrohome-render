import { create } from "zustand";

import { apiClientFetch } from "@/lib/api-client";
import type { CartSummary } from "@/lib/types";

interface CartState {
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await apiClientFetch<CartSummary>("/api/cart/");
      set({ summary, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Error al cargar el carrito" });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ error: null });
    try {
      const summary = await apiClientFetch<CartSummary>("/api/cart/items/", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      set({ summary });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "No se pudo agregar el producto" });
      throw e;
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ error: null });
    try {
      const summary = await apiClientFetch<CartSummary>(`/api/cart/items/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      set({ summary });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "No se pudo actualizar la cantidad" });
    }
  },

  removeItem: async (itemId) => {
    set({ error: null });
    try {
      const summary = await apiClientFetch<CartSummary>(`/api/cart/items/${itemId}/`, {
        method: "DELETE",
      });
      set({ summary });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "No se pudo eliminar el producto" });
    }
  },

  clearCart: async () => {
    set({ error: null });
    try {
      const summary = await apiClientFetch<CartSummary>("/api/cart/", { method: "DELETE" });
      set({ summary });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "No se pudo vaciar el carrito" });
    }
  },
}));
