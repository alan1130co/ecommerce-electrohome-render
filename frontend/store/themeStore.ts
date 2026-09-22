import { create } from "zustand";

import { THEME_COOKIE } from "@/lib/theme";

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

// El <html> ya trae la clase .dark aplicada por el servidor (ver
// app/layout.tsx, que lee la cookie eh-theme) antes de que este store se
// inicialice — leerla acá es sincrónico y no causa flash ni desajuste
// con lo que el usuario ya está viendo.
function readInitialDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: readInitialDark(),

  toggle: () => {
    const next = !get().dark;
    document.documentElement.classList.toggle("dark", next);
    // 1 año, path raíz — la lee app/layout.tsx en cada request para fijar
    // la clase inicial en el servidor (nada de localStorage).
    document.cookie = `${THEME_COOKIE}=${next ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
    set({ dark: next });
  },
}));
