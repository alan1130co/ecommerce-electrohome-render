"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

export default function ToggleBannerButton({ bannerId, activo }: { bannerId: number; activo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClientFetch(`/api/dashboard/banners/${bannerId}/toggle/`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo cambiar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${
          activo
            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-400/15 text-slate-400"
        }`}
      >
        {activo ? "✓ Activo" : "✗ Inactivo"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
