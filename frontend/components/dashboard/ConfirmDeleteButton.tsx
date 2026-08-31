"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

/** Botón de borrado reutilizado en productos/categorías/promociones/
 * banners/reseñas — reemplaza el patrón "GET muestra confirmación, POST
 * borra" de las views originales por un confirm() nativo + DELETE, y
 * refresca la Server Component de la lista (router.refresh()) en vez de
 * redirect+mensaje flash. */
export default function ConfirmDeleteButton({
  endpoint,
  confirmMessage,
  label = "Eliminar",
  className,
}: {
  endpoint: string;
  confirmMessage: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    setError(null);
    try {
      await apiClientFetch(endpoint, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar");
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className ?? "text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"}
      >
        {loading ? "Eliminando..." : label}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  );
}
