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

export default function CambiarEstadoPedido({
  pedidoId,
  orderNumber,
  status,
}: {
  pedidoId: number;
  orderNumber: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClientFetch(`/api/dashboard/pedidos/${pedidoId}/estado/`, {
        method: "POST",
        body: JSON.stringify({ status: nuevoEstado }),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo cambiar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-3 py-1.5 text-sm font-semibold text-white"
      >
        <i className="fas fa-edit mr-1" /> Estado
      </button>

      {open && (
        <div
          className="fixed inset-0 z-3000 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-linear-to-br from-slate-900 to-blue-900 px-6 py-5">
              <h3 className="font-bold text-white">
                <i className="fas fa-edit mr-2 text-amber-500" />
                Cambiar Estado
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Pedido <strong className="text-blue-900 dark:text-blue-300">#{orderNumber}</strong>
                </p>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  Nuevo Estado
                </label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              </div>
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border-2 border-slate-200 px-5 py-2 text-sm font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <i className="fas fa-save mr-1" /> {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
