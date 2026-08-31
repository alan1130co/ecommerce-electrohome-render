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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checked: false,
  loading: false,
  error: null,

  fetchMe: async () => {
    try {
      const user = await apiClientFetch<User>("/api/auth/me/");
      set({ user, checked: true });
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        set({ user: null, checked: true });
      } else {
        set({ checked: true });
      }
    }
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
