"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { UsuarioAdmin } from "@/lib/dashboard-types";

const inputClass =
  "w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-400";

export default function EnvioMasivoForm({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [descuento, setDescuento] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
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

  const toggleTodos = () => setSeleccionados(new Set(usuarios.map((u) => u.id)));
  const toggleNinguno = () => setSeleccionados(new Set());

  const handleImagen = (file: File | null) => {
    setImagen(file);
    setImagenPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seleccionados.size === 0) {
      setError("Debes seleccionar al menos un usuario.");
      return;
    }
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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
        <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
          <i className="fas fa-pen mr-2 text-amber-500" /> Redactar Correo
        </div>
        <div className="p-6">
          {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
          {resultado && (
            <p className="mb-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              Correos enviados: {resultado.enviados}. Errores: {resultado.errores}.
            </p>
          )}

          <div className="mb-3">
            <label htmlFor="em-asunto" className={labelClass}>
              Asunto
            </label>
            <input
              id="em-asunto"
              required
              placeholder="Ej: ¡Oferta exclusiva para ti!"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="em-mensaje" className={labelClass}>
              Mensaje
            </label>
            <textarea
              id="em-mensaje"
              required
              rows={4}
              placeholder="Escribe el mensaje principal..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="em-cupon" className={labelClass}>
                Código de Cupón
              </label>
              <input
                id="em-cupon"
                placeholder="Ej: SAVE20"
                value={codigoCupon}
                onChange={(e) => setCodigoCupon(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="em-descuento" className={labelClass}>
                Descuento
              </label>
              <input
                id="em-descuento"
                placeholder="Ej: 20%OFF"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Imagen del correo</label>
            <label
              htmlFor="em-imagen"
              className="block cursor-pointer rounded-[10px] border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-blue-400 dark:border-slate-600"
            >
              {imagenPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local vía object URL, next/image no aplica
                <img
                  src={imagenPreview}
                  alt="Preview"
                  className="mb-3 max-h-35 w-full rounded-lg object-cover"
                />
              ) : (
                <>
                  <i className="fas fa-image mb-2 block text-3xl text-slate-300 dark:text-slate-600" />
                  <span className="text-sm text-slate-400">Clic para subir imagen (JPG, PNG)</span>
                </>
              )}
              <input
                id="em-imagen"
                type="file"
                accept="image/*"
                onChange={(e) => handleImagen(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-br from-blue-700 to-blue-900 py-3 font-semibold text-white disabled:opacity-50"
          >
            <i className="fas fa-paper-plane" /> {submitting ? "Enviando..." : "Enviar a Seleccionados"}
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">{seleccionados.size}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
        <div className="flex items-center justify-between bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
          <span>
            <i className="fas fa-users mr-2 text-amber-500" /> Usuarios Registrados
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleTodos}
              className="rounded-md border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={toggleNinguno}
              className="rounded-md border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
            >
              Ninguno
            </button>
          </div>
        </div>
        <div className="max-h-107.5 flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={seleccionados.size === usuarios.length && usuarios.length > 0}
                    onChange={(e) => (e.target.checked ? toggleTodos() : toggleNinguno())}
                    className="h-4 w-4 accent-blue-700"
                  />
                </th>
                <th className="px-4 py-2 font-semibold">Nombre</th>
                <th className="px-4 py-2 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(u.id)}
                      onChange={() => toggle(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 accent-blue-700"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-slate-200">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-slate-400">{u.email}</td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                    No hay clientes activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-sm text-gray-500 dark:text-slate-400">
          <strong className="text-gray-800 dark:text-slate-200">{seleccionados.size}</strong> usuario(s) seleccionado(s)
        </div>
      </div>
    </form>
  );
}
