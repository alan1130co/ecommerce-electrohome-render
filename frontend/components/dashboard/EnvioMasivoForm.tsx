"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { UsuarioAdmin } from "@/lib/dashboard-types";

export default function EnvioMasivoForm({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [descuento, setDescuento] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ enviados: number; errores: number } | null>(null);

  const toggle = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    setSeleccionados((prev) => (prev.size === usuarios.length ? new Set() : new Set(usuarios.map((u) => u.id))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("asunto", asunto);
    formData.append("mensaje", mensaje);
    formData.append("codigo_cupon", codigoCupon);
    formData.append("descuento", descuento);
    seleccionados.forEach((id) => formData.append("destinatarios", String(id)));
    if (imagen) formData.append("imagen", imagen);

    try {
      const res = await apiClientFetch<{ enviados: number; errores: number }>("/api/dashboard/envio-masivo/", {
        method: "POST",
        body: formData,
      });
      setResultado(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo enviar la campaña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}
        {resultado && (
          <p className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
            Correos enviados: {resultado.enviados}. Errores: {resultado.errores}.
          </p>
        )}

        <div>
          <label htmlFor="em-asunto" className="mb-1 block text-sm font-medium text-gray-700">
            Asunto
          </label>
          <input
            id="em-asunto"
            required
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="em-mensaje" className="mb-1 block text-sm font-medium text-gray-700">
            Mensaje
          </label>
          <textarea
            id="em-mensaje"
            required
            rows={6}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="em-cupon" className="mb-1 block text-sm font-medium text-gray-700">
              Código de cupón (opcional)
            </label>
            <input
              id="em-cupon"
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="em-descuento" className="mb-1 block text-sm font-medium text-gray-700">
              Descuento (opcional)
            </label>
            <input id="em-descuento" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="em-imagen" className="mb-1 block text-sm font-medium text-gray-700">
            Imagen (opcional)
          </label>
          <input
            id="em-imagen"
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || seleccionados.size === 0}
          className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : `Enviar a ${seleccionados.size} usuario(s)`}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Destinatarios ({seleccionados.size}/{usuarios.length})
          </h3>
          <button type="button" onClick={toggleTodos} className="text-xs font-semibold text-blue-700 hover:underline">
            {seleccionados.size === usuarios.length ? "Ninguno" : "Todos"}
          </button>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {usuarios.map((u) => (
            <label key={u.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={seleccionados.has(u.id)} onChange={() => toggle(u.id)} />
              <span className="truncate">{u.email}</span>
            </label>
          ))}
          {usuarios.length === 0 && <p className="text-sm text-gray-400">No hay clientes activos.</p>}
        </div>
      </div>
    </form>
  );
}
