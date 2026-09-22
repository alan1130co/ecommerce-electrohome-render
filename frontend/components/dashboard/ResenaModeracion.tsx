"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

const MOTIVOS = [
  "Lenguaje inapropiado u ofensivo",
  "Contenido irrelevante para el producto",
  "Spam o contenido publicitario",
  "Foto inapropiada o con contenido sensible",
  "Información falsa o engañosa",
];

export default function ResenaModeracion({ resenaId, estado }: { resenaId: number; estado: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [motivoTexto, setMotivoTexto] = useState("");

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

  const confirmarRechazo = async (e: React.FormEvent) => {
    e.preventDefault();
    const motivo = motivoSeleccionado === "otro" ? motivoTexto : motivoSeleccionado;
    await run(async () => {
      await apiClientFetch(`/api/dashboard/resenas/${resenaId}/rechazar/`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      });
    });
    setRechazoOpen(false);
  };

  const eliminar = () =>
    run(async () => {
      if (!window.confirm("¿Eliminar esta reseña definitivamente?")) throw new ApiClientError(0, "cancelado");
      await apiClientFetch(`/api/dashboard/resenas/${resenaId}/eliminar/`, { method: "DELETE" });
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado !== "aprobada" && (
        <button
          type="button"
          onClick={aprobar}
          disabled={loading}
          className="rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <i className="fas fa-check mr-1" /> Aprobar
        </button>
      )}
      {estado !== "rechazada" && (
        <button
          type="button"
          onClick={() => setRechazoOpen(true)}
          disabled={loading}
          className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          <i className="fas fa-ban mr-1" /> Rechazar
        </button>
      )}
      <button
        type="button"
        onClick={eliminar}
        disabled={loading}
        className="rounded-lg bg-linear-to-br from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <i className="fas fa-trash mr-1" /> Eliminar
      </button>
      {error && error !== "cancelado" && <span className="text-xs text-red-500">{error}</span>}

      {rechazoOpen && (
        <div
          className="fixed inset-0 z-3000 flex items-center justify-center bg-black/50"
          onClick={() => setRechazoOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-linear-to-br from-amber-500 to-amber-600 px-6 py-5">
              <h3 className="font-bold text-slate-900">
                <i className="fas fa-ban mr-2" />
                Rechazar Reseña
              </h3>
              <button
                type="button"
                onClick={() => setRechazoOpen(false)}
                aria-label="Cerrar"
                className="text-slate-900/60 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <form onSubmit={confirmarRechazo}>
              <div className="p-6">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">Motivo del rechazo</label>
                <select
                  value={motivoSeleccionado}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  required
                  className="mb-3 w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">— Selecciona un motivo —</option>
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="otro">Otro (escribir abajo)</option>
                </select>
                {motivoSeleccionado === "otro" && (
                  <textarea
                    value={motivoTexto}
                    onChange={(e) => setMotivoTexto(e.target.value)}
                    rows={3}
                    placeholder="Escribe el motivo..."
                    required
                    className="w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setRechazoOpen(false)}
                  className="rounded-lg border-2 border-slate-200 px-5 py-2 text-sm font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-5 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                >
                  <i className="fas fa-ban mr-1" /> Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
