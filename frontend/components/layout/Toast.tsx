"use client";

import { useEffect } from "react";

import { useToastStore } from "@/store/toastStore";

const AUTO_DISMISS_MS = 2800;

// Confirmación flotante genérica (ej. "agregado a favoritos") — azul de
// marca, deliberadamente distinto del verde que usa producción.
export default function Toast() {
  const { message, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message, hide]);

  return (
    <div
      className={`fixed top-20 right-4 z-[2147483646] max-w-[calc(100vw-2rem)] transition-all duration-300 lg:top-24 lg:right-6 ${
        message ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 px-6 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]">
        <i className="fas fa-check-circle text-lg" />
        {message}
      </div>
    </div>
  );
}
