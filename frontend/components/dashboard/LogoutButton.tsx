"use client";

import { useState } from "react";

import { apiClientFetch } from "@/lib/api-client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiClientFetch("/api/dashboard/auth/logout/", { method: "POST" });
    } finally {
      // Navegación dura — ver nota en app/dashboard/login/page.tsx sobre
      // por qué router.push() no sirve acá.
      window.location.href = "/dashboard/login/";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
