"use client";

import Image from "next/image";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { BannerAdmin } from "@/lib/dashboard-types";

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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      <div>
        <label htmlFor="b-titulo" className="mb-1 block text-sm font-medium text-gray-700">
          Título del banner
        </label>
        <input
          id="b-titulo"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="input"
        />
        {fieldErrors?.titulo && <p className="mt-1 text-xs text-red-500">{fieldErrors.titulo.join(" ")}</p>}
      </div>

      <div>
        <label htmlFor="b-subtitulo" className="mb-1 block text-sm font-medium text-gray-700">
          Subtítulo
        </label>
        <input id="b-subtitulo" value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} className="input" />
      </div>

      <div>
        <label htmlFor="b-imagen" className="mb-1 block text-sm font-medium text-gray-700">
          Imagen del banner
        </label>
        {banner?.imagen && !imagenFile && (
          <div className="relative mb-2 h-24 w-full max-w-xs overflow-hidden rounded-md border border-gray-200">
            <Image src={banner.imagen} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <input
          id="b-imagen"
          type="file"
          accept="image/*"
          required={!banner}
          onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
          className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
        {banner && <p className="mt-1 text-xs text-gray-400">Deja vacío para conservar la imagen actual.</p>}
        {fieldErrors?.imagen && <p className="mt-1 text-xs text-red-500">{fieldErrors.imagen.join(" ")}</p>}
      </div>

      <div>
        <label htmlFor="b-url" className="mb-1 block text-sm font-medium text-gray-700">
          URL al hacer clic
        </label>
        <input id="b-url" value={urlDestino} onChange={(e) => setUrlDestino(e.target.value)} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="b-texto-boton" className="mb-1 block text-sm font-medium text-gray-700">
            Texto del botón
          </label>
          <input
            id="b-texto-boton"
            value={textoBoton}
            onChange={(e) => setTextoBoton(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="b-color-boton" className="mb-1 block text-sm font-medium text-gray-700">
            Color del botón
          </label>
          <input
            id="b-color-boton"
            type="color"
            value={colorBoton}
            onChange={(e) => setColorBoton(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300"
          />
        </div>
      </div>

      <div>
        <label htmlFor="b-orden" className="mb-1 block text-sm font-medium text-gray-700">
          Orden (0 = primero)
        </label>
        <input
          id="b-orden"
          type="number"
          min="0"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="input"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Banner activo
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : banner ? "Actualizar banner" : "Crear banner"}
      </button>
    </form>
  );
}
