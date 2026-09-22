import { create } from "zustand";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  checked: boolean;
  loading: boolean;
  error: string | null;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// AuthStatus (desktop) y MobileMenu (mobile) están montados a la vez y
// cada uno llama fetchMe() en su propio efecto — deduplicar el fetch en
// vuelo evita 2 respuestas separadas (2 objetos `user` con distinta
// referencia), que a su vez duplicaban cualquier efecto con `user` en sus
// dependencias (ver mismo problema en wishlistStore.ts).
let inFlightFetch: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checked: false,
  loading: false,
  error: null,

  fetchMe: async () => {
    if (inFlightFetch) return inFlightFetch;
    inFlightFetch = (async () => {
      try {
        const user = await apiClientFetch<User>("/api/auth/me/");
        set({ user, checked: true });
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          set({ user: null, checked: true });
        } else {
          set({ checked: true });
        }
      } finally {
        inFlightFetch = null;
      }
    })();
    return inFlightFetch;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await apiClientFetch<User>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      set({ user, loading: false, checked: true });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "No se pudo iniciar sesión",
      });
      throw e;
    }
  },

  logout: async () => {
    await apiClientFetch("/api/auth/logout/", { method: "POST" });
    set({ user: null });
  },
}));
