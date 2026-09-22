"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { CategoriaAdmin } from "@/lib/dashboard-types";

const inputClass =
  "w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-400";

export default function CategoriaForm({ categoria, cardTitle }: { categoria?: CategoriaAdmin; cardTitle: string }) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? "");
  const [activo, setActivo] = useState(categoria?.activo ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);

    const payload = { nombre, descripcion, activo };

    try {
      if (categoria) {
        await apiClientFetch(`/api/dashboard/categorias/${categoria.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClientFetch("/api/dashboard/categorias/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      window.location.href = "/dashboard/categorias/";
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: Record<string, string[]> } | undefined;
        setFieldErrors(body?.errors ?? null);
        setError(err.message);
      } else {
        setError("No se pudo guardar la categoría");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
      <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
        <i className="fas fa-list mr-2 text-amber-500" /> {cardTitle}
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        <div className="mb-4">
          <label htmlFor="c-nombre" className={labelClass}>
            Nombre de la Categoría
          </label>
          <input
            id="c-nombre"
            required
            placeholder="Nombre de la categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
          {fieldErrors?.nombre && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.nombre.join(" ")}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="c-descripcion" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="c-descripcion"
            rows={4}
            placeholder="Descripción de la categoría"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={inputClass}
          />
          {fieldErrors?.descripcion && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.descripcion.join(" ")}</p>
          )}
        </div>

        <label className="mb-7 flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          Categoría Activa
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-7 py-2.5 font-semibold text-slate-900 disabled:opacity-50"
          >
            <i className="fas fa-save mr-1" />{" "}
            {submitting ? "Guardando..." : categoria ? "Actualizar Categoría" : "Crear Categoría"}
          </button>
          <a
            href="/dashboard/categorias/"
            className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-6 py-2.5 font-semibold text-white"
          >
            <i className="fas fa-times mr-1" /> Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
