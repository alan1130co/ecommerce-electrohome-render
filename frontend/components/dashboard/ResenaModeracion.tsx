"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

export default function ResenaModeracion({ resenaId, estado }: { resenaId: number; estado: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo completar la acción");
    } finally {
      setLoading(false);
    }
  };

  const aprobar = () =>
    run(async () => {
      await apiClientFetch(`/api/dashboard/resenas/${resenaId}/aprobar/`, { method: "POST" });
    });

  const rechazar = () =>
    run(async () => {
      const motivo = window.prompt("Motivo del rechazo (se muestra al cliente si aplica):", "");
      if (motivo === null) throw new ApiClientError(0, "cancelado");
      await apiClientFetch(`/api/dashboard/resenas/${resenaId}/rechazar/`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      });
    });

  const eliminar = () =>
    run(async () => {
      if (!window.confirm("¿Eliminar esta reseña definitivamente?")) throw new ApiClientError(0, "cancelado");
      await apiClientFetch(`/api/dashboard/resenas/${resenaId}/eliminar/`, { method: "DELETE" });
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {estado !== "aprobada" && (
          <button
            type="button"
            onClick={aprobar}
            disabled={loading}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Aprobar
          </button>
        )}
        {estado !== "rechazada" && (
          <button
            type="button"
            onClick={rechazar}
            disabled={loading}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Rechazar
          </button>
        )}
        <button
          type="button"
          onClick={eliminar}
          disabled={loading}
          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
      {error && error !== "cancelado" && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
