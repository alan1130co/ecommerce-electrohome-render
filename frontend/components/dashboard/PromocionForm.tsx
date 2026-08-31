"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { PromocionAdmin } from "@/lib/dashboard-types";

export default function PromocionForm({
  productos,
  promocion,
}: {
  productos: { id: number; nombre: string }[];
  promocion?: PromocionAdmin;
}) {
  const [productoId, setProductoId] = useState(String(promocion?.producto ?? productos[0]?.id ?? ""));
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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      <div>
        <label htmlFor="pr-producto" className="mb-1 block text-sm font-medium text-gray-700">
          Producto
        </label>
        <select
          id="pr-producto"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          className="input"
        >
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {fieldErrors?.producto && <p className="mt-1 text-xs text-red-500">{fieldErrors.producto.join(" ")}</p>}
      </div>

      <div>
        <label htmlFor="pr-descuento" className="mb-1 block text-sm font-medium text-gray-700">
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
          className="input"
        />
        {fieldErrors?.descuento_porcentaje && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.descuento_porcentaje.join(" ")}</p>
        )}
      </div>

      <div>
        <label htmlFor="pr-etiqueta" className="mb-1 block text-sm font-medium text-gray-700">
          Etiqueta
        </label>
        <input
          id="pr-etiqueta"
          placeholder="Ej: OFERTA, BLACK FRIDAY"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pr-fecha-inicio" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha inicio
          </label>
          <input
            id="pr-fecha-inicio"
            required
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="input"
          />
          {fieldErrors?.fecha_inicio && <p className="mt-1 text-xs text-red-500">{fieldErrors.fecha_inicio.join(" ")}</p>}
        </div>
        <div>
          <label htmlFor="pr-fecha-fin" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha fin
          </label>
          <input
            id="pr-fecha-fin"
            required
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="input"
          />
          {fieldErrors?.fecha_fin && <p className="mt-1 text-xs text-red-500">{fieldErrors.fecha_fin.join(" ")}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Promoción activa
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : promocion ? "Actualizar promoción" : "Crear promoción"}
      </button>
    </form>
  );
}
