"use client";

import Image from "next/image";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { BannerAdmin } from "@/lib/dashboard-types";

const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300";

// A diferencia de Producto/ImagenProducto, BannerPromocion.imagen SÍ es un
// ImageField real (no CharField con widget roto) — el upload multipart de
// toda la vida funciona tal cual, sin el paso intermedio de subir primero
// y pegar la URL después.
export default function BannerForm({ banner }: { banner?: BannerAdmin }) {
  const [titulo, setTitulo] = useState(banner?.titulo ?? "");
  const [subtitulo, setSubtitulo] = useState(banner?.subtitulo ?? "");
  const [urlDestino, setUrlDestino] = useState(banner?.url_destino ?? "/productos/");
  const [textoBoton, setTextoBoton] = useState(banner?.texto_boton ?? "Ver ofertas");
  const [colorBoton, setColorBoton] = useState(banner?.color_boton ?? "#f59e0b");
  const [orden, setOrden] = useState(String(banner?.orden ?? 0));
  const [activo, setActivo] = useState(banner?.activo ?? true);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("subtitulo", subtitulo);
    formData.append("url_destino", urlDestino);
    formData.append("texto_boton", textoBoton);
    formData.append("color_boton", colorBoton);
    formData.append("orden", orden);
    formData.append("activo", activo ? "true" : "");
    if (imagenFile) formData.append("imagen", imagenFile);

    try {
      if (banner) {
        await apiClientFetch(`/api/dashboard/banners/${banner.id}/`, { method: "PUT", body: formData });
      } else {
        await apiClientFetch("/api/dashboard/banners/", { method: "POST", body: formData });
      }
      window.location.href = "/dashboard/secciones/";
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: Record<string, string[]> } | undefined;
        setFieldErrors(body?.errors ?? null);
        setError(err.message);
      } else {
        setError("No se pudo guardar el banner");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-slate-800">
      <form onSubmit={handleSubmit}>
        {error && <p className="m-6 mb-0 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        <div className="grid gap-5 p-6">
          <div>
            <label htmlFor="b-titulo" className={labelClass}>
              Título del banner *
            </label>
            <input
              id="b-titulo"
              required
              placeholder="Ej: Hasta 50% OFF en electrodomésticos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={inputClass}
            />
            {fieldErrors?.titulo && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.titulo.join(" ")}</p>}
          </div>

          <div>
            <label htmlFor="b-subtitulo" className={labelClass}>
              Subtítulo
            </label>
            <input
              id="b-subtitulo"
              placeholder="Ej: Ofertas por tiempo limitado"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="b-imagen" className={labelClass}>
              Imagen del banner {!banner && "*"}
            </label>
            {banner?.imagen && !imagenFile && (
              <div className="relative mb-2 h-24 w-full max-w-xs overflow-hidden rounded-md border border-gray-200 dark:border-slate-600">
                <Image src={banner.imagen} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <input
              id="b-imagen"
              type="file"
              accept="image/*"
              required={!banner}
              onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
              className={inputClass}
            />
            {banner && <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Deja vacío para conservar la imagen actual.</p>}
            {fieldErrors?.imagen && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.imagen.join(" ")}</p>}
          </div>

          <div>
            <label htmlFor="b-url" className={labelClass}>
              URL al hacer clic
            </label>
            <input
              id="b-url"
              placeholder="/productos/?categoria=7"
              value={urlDestino}
              onChange={(e) => setUrlDestino(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Ej: /productos/?categoria=5 o /productos/</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="b-texto-boton" className={labelClass}>
                Texto del botón
              </label>
              <input
                id="b-texto-boton"
                placeholder="Ver ofertas"
                value={textoBoton}
                onChange={(e) => setTextoBoton(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="b-color-boton" className={labelClass}>
                Color del botón
              </label>
              <input
                id="b-color-boton"
                type="color"
                value={colorBoton}
                onChange={(e) => setColorBoton(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 dark:border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div>
              <label htmlFor="b-orden" className={labelClass}>
                Orden
              </label>
              <input
                id="b-orden"
                type="number"
                min="0"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2.5 pb-1 font-semibold text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 accent-blue-700"
              />
              Banner activo
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-6 py-2.5 font-semibold text-slate-900 disabled:opacity-50"
          >
            <i className="fas fa-save mr-1" /> {submitting ? "Guardando..." : banner ? "Actualizar" : "Crear"}
          </button>
          <a href="/dashboard/secciones/" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
