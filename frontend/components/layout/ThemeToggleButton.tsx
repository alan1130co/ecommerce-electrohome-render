"use client";

import { useThemeStore } from "@/store/themeStore";

// Botón circular sol/luna — usado tal cual en el header del storefront
// (Navbar) y en el del dashboard (DashboardShell), ambos ya traían este
// mismo markup duplicado sin funcionalidad. Ahora comparten un solo
// componente y el mismo store (useThemeStore).
export default function ThemeToggleButton({ className = "theme-toggle-button" }: { className?: string }) {
  const { dark, toggle } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <i className={`fas ${dark ? "fa-moon" : "fa-sun"}`} />
    </button>
  );
}
