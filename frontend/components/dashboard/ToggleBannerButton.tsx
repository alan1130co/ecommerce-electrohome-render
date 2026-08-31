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
        className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
          activo ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {activo ? "Activo" : "Inactivo"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
