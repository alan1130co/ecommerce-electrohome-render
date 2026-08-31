"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { CategoriaAdmin } from "@/lib/dashboard-types";

export default function CategoriaForm({ categoria }: { categoria?: CategoriaAdmin }) {
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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      <div>
        <label htmlFor="c-nombre" className="mb-1 block text-sm font-medium text-gray-700">
          Nombre de la categoría
        </label>
        <input
          id="c-nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="input"
        />
        {fieldErrors?.nombre && <p className="mt-1 text-xs text-red-500">{fieldErrors.nombre.join(" ")}</p>}
      </div>

      <div>
        <label htmlFor="c-descripcion" className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="c-descripcion"
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="input"
        />
        {fieldErrors?.descripcion && <p className="mt-1 text-xs text-red-500">{fieldErrors.descripcion.join(" ")}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Categoría activa
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : categoria ? "Actualizar categoría" : "Crear categoría"}
      </button>
    </form>
  );
}
