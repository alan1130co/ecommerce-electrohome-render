"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

const ESTADOS = [
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export default function CambiarEstadoPedido({ pedidoId, status }: { pedidoId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    setLoading(true);
    setError(null);
    try {
      await apiClientFetch(`/api/dashboard/pedidos/${pedidoId}/estado/`, {
        method: "POST",
        body: JSON.stringify({ status: nuevoEstado }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo cambiar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <select
        defaultValue={status}
        onChange={handleChange}
        disabled={loading}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
