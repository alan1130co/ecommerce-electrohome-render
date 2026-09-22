"use client";

import { useState } from "react";

import { apiClientFetch } from "@/lib/api-client";

export default function LogoutButton({ className }: { className?: string }) {
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
    <button type="button" onClick={handleLogout} disabled={loading} className={className}>
      <i className="fas fa-sign-out-alt" /> {loading ? "Saliendo..." : "Cerrar Sesión"}
    </button>
  );
}
