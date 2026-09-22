"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { PromocionAdmin } from "@/lib/dashboard-types";

const inputClass =
  "w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-400";

export default function PromocionForm({
  productos,
  promocion,
  cardTitle,
}: {
  productos: { id: number; nombre: string }[];
  promocion?: PromocionAdmin;
  cardTitle: string;
}) {
  const [productoId, setProductoId] = useState(String(promocion?.producto ?? ""));
  const [descuento, setDescuento] = useState(promocion?.descuento_porcentaje ?? "");
  const [etiqueta, setEtiqueta] = useState(promocion?.etiqueta ?? "OFERTA");
  const [fechaInicio, setFechaInicio] = useState(promocion?.fecha_inicio ?? "");
  const [fechaFin, setFechaFin] = useState(promocion?.fecha_fin ?? "");
  const [activo, setActivo] = useState(promocion?.activo ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);

    const payload = {
      producto: productoId,
      descuento_porcentaje: descuento,
      etiqueta,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      activo,
    };

    try {
      if (promocion) {
        await apiClientFetch(`/api/dashboard/promociones/${promocion.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClientFetch("/api/dashboard/promociones/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      window.location.href = "/dashboard/promociones/";
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: Record<string, string[]> } | undefined;
        setFieldErrors(body?.errors ?? null);
        setError(err.message);
      } else {
        setError("No se pudo guardar la promoción");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
      <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
        <i className="fas fa-tag mr-2 text-amber-500" /> {cardTitle}
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        <div className="mb-4">
          <label htmlFor="pr-producto" className={labelClass}>
            Producto
          </label>
          <select
            id="pr-producto"
            required
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className={inputClass}
          >
            <option value="">---------</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {fieldErrors?.producto && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.producto.join(" ")}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="pr-descuento" className={labelClass}>
            Descuento (%)
          </label>
          <input
            id="pr-descuento"
            required
            type="number"
            step="0.01"
            min="1"
            max="99"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">El precio promocional se calculará automáticamente al guardar.</p>
          {fieldErrors?.descuento_porcentaje && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.descuento_porcentaje.join(" ")}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="pr-etiqueta" className={labelClass}>
            Etiqueta de la Cinta
          </label>
          <input
            id="pr-etiqueta"
            placeholder="OFERTA"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Texto en la cinta del producto. Ej: OFERTA, -20%, BLACK FRIDAY</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pr-fecha-inicio" className={labelClass}>
              Fecha Inicio
            </label>
            <input
              id="pr-fecha-inicio"
              required
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={inputClass}
            />
            {fieldErrors?.fecha_inicio && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.fecha_inicio.join(" ")}</p>
            )}
          </div>
          <div>
            <label htmlFor="pr-fecha-fin" className={labelClass}>
              Fecha Fin
            </label>
            <input
              id="pr-fecha-fin"
              required
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={inputClass}
            />
            {fieldErrors?.fecha_fin && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.fecha_fin.join(" ")}</p>}
          </div>
        </div>

        <label className="mb-7 flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          Activo
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-7 py-2.5 font-semibold text-slate-900 disabled:opacity-50"
          >
            <i className="fas fa-save mr-1" /> {submitting ? "Guardando..." : promocion ? "Actualizar" : "Crear"}
          </button>
          <a
            href="/dashboard/promociones/"
            className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-6 py-2.5 font-semibold text-white"
          >
            <i className="fas fa-times mr-1" /> Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
