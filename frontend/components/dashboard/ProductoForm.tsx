"use client";

import Image from "next/image";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { Categoria, ProductoDetalle } from "@/lib/types";
import { subirImagen } from "@/lib/uploadImagen";

interface GaleriaRow {
  id?: number;
  url: string;
  descripcion: string;
  toDelete: boolean;
  uploading: boolean;
}

function flattenCategorias(categorias: Categoria[]): { id: number; label: string }[] {
  const out: { id: number; label: string }[] = [];
  for (const cat of categorias) {
    out.push({ id: cat.id, label: cat.nombre });
    for (const sub of cat.subcategorias) {
      out.push({ id: sub.id, label: `— ${sub.nombre}` });
    }
  }
  return out;
}

export default function ProductoForm({
  categorias,
  producto,
}: {
  categorias: Categoria[];
  producto?: ProductoDetalle;
}) {
  const categoriaOpciones = flattenCategorias(categorias);

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [categoriaId, setCategoriaId] = useState(String(producto?.categoria.id ?? categoriaOpciones[0]?.id ?? ""));
  const [precio, setPrecio] = useState(producto?.precio ?? "");
  const [stock, setStock] = useState(String(producto?.stock ?? "0"));
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [capacidad, setCapacidad] = useState(producto?.capacidad ?? "");
  const [potencia, setPotencia] = useState(producto?.potencia ?? "");
  const [color, setColor] = useState(producto?.color ?? "");
  const [garantiaMeses, setGarantiaMeses] = useState(String(producto?.garantia_meses ?? ""));
  const [caracteristicas, setCaracteristicas] = useState(producto?.caracteristicas_destacadas ?? "");
  const [activo, setActivo] = useState(producto?.disponible !== undefined ? true : true);

  const [imagenPrincipalUrl, setImagenPrincipalUrl] = useState(producto?.imagen_principal ?? "");
  const [subiendoPrincipal, setSubiendoPrincipal] = useState(false);

  const [galeria, setGaleria] = useState<GaleriaRow[]>(
    (producto?.galeria ?? []).map((img) => ({
      id: img.id,
      url: img.imagen,
      descripcion: img.descripcion,
      toDelete: false,
      uploading: false,
    })),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handlePrincipalFile = async (file: File | null) => {
    if (!file) return;
    setSubiendoPrincipal(true);
    try {
      const url = await subirImagen(file);
      setImagenPrincipalUrl(url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendoPrincipal(false);
    }
  };

  const handleGaleriaFile = async (file: File | null) => {
    if (!file) return;
    const idx = galeria.length;
    setGaleria((prev) => [...prev, { url: "", descripcion: "", toDelete: false, uploading: true }]);
    try {
      const url = await subirImagen(file);
      setGaleria((prev) => prev.map((row, i) => (i === idx ? { ...row, url, uploading: false } : row)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo subir la imagen");
      setGaleria((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updateGaleriaDescripcion = (idx: number, descripcion: string) => {
    setGaleria((prev) => prev.map((row, i) => (i === idx ? { ...row, descripcion } : row)));
  };

  const toggleGaleriaDelete = (idx: number) => {
    setGaleria((prev) => prev.map((row, i) => (i === idx ? { ...row, toDelete: !row.toDelete } : row)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);

    const payload: Record<string, string | boolean> = {
      nombre,
      descripcion,
      categoria: categoriaId,
      precio,
      stock,
      marca,
      capacidad,
      potencia,
      color,
      garantia_meses: garantiaMeses,
      caracteristicas_destacadas: caracteristicas,
      activo,
      imagen_principal_url: imagenPrincipalUrl,
      // Prefijo "galeria", no "form": inlineformset_factory deriva el prefijo
      // por defecto del related_name del FK (ImagenProducto.producto tiene
      // related_name='galeria') — sin esto el ManagementForm del backend se
      // ve "faltante" y formset.is_valid() falla siempre, tumbando CUALQUIER
      // edición de producto con 400 (ver ProductoAdminDetailAPIView.put).
      "galeria-TOTAL_FORMS": String(galeria.length),
      "galeria-INITIAL_FORMS": String(galeria.filter((g) => g.id).length),
      "galeria-MIN_NUM_FORMS": "0",
      "galeria-MAX_NUM_FORMS": "1000",
    };
    galeria.forEach((img, i) => {
      if (img.id) payload[`galeria-${i}-id`] = String(img.id);
      payload[`galeria-${i}-descripcion`] = img.descripcion;
      payload[`galeria-${i}-imagen_url`] = img.url;
      if (img.toDelete) payload[`galeria-${i}-DELETE`] = true;
    });

    try {
      if (producto) {
        await apiClientFetch(`/api/dashboard/productos/${producto.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClientFetch("/api/dashboard/productos/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      window.location.href = "/dashboard/productos/";
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: Record<string, string[]> } | undefined;
        setFieldErrors(body?.errors ?? null);
        setError(err.message);
      } else {
        setError("No se pudo guardar el producto");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (field: string) => fieldErrors?.[field]?.join(" ");

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-nombre" label="Nombre del producto" error={errorFor("nombre")} className="sm:col-span-2">
          <input
            id="p-nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-descripcion" label="Descripción" error={errorFor("descripcion")} className="sm:col-span-2">
          <textarea
            id="p-descripcion"
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-categoria" label="Categoría" error={errorFor("categoria")}>
          <select
            id="p-categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="input"
          >
            {categoriaOpciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="p-precio" label="Precio ($)" error={errorFor("precio")}>
          <input
            id="p-precio"
            required
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-stock" label="Stock" error={errorFor("stock")}>
          <input
            id="p-stock"
            required
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-marca" label="Marca" error={errorFor("marca")}>
          <input id="p-marca" value={marca} onChange={(e) => setMarca(e.target.value)} className="input" />
        </Field>

        <Field id="p-capacidad" label="Capacidad" error={errorFor("capacidad")}>
          <input
            id="p-capacidad"
            placeholder="Ej: 100L, 2.5 HP"
            value={capacidad}
            onChange={(e) => setCapacidad(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-potencia" label="Potencia" error={errorFor("potencia")}>
          <input
            id="p-potencia"
            placeholder="Ej: 1500W"
            value={potencia}
            onChange={(e) => setPotencia(e.target.value)}
            className="input"
          />
        </Field>

        <Field id="p-color" label="Color" error={errorFor("color")}>
          <input id="p-color" value={color} onChange={(e) => setColor(e.target.value)} className="input" />
        </Field>

        <Field id="p-garantia" label="Garantía (meses)" error={errorFor("garantia_meses")}>
          <input
            id="p-garantia"
            type="number"
            value={garantiaMeses}
            onChange={(e) => setGarantiaMeses(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          id="p-caracteristicas"
          label="Características destacadas"
          error={errorFor("caracteristicas_destacadas")}
          className="sm:col-span-2"
        >
          <input
            id="p-caracteristicas"
            placeholder="Separa con comas (No Frost, Inverter, Digital)"
            value={caracteristicas}
            onChange={(e) => setCaracteristicas(e.target.value)}
            className="input"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Producto activo (visible en la tienda)
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Imagen principal</h3>
        {imagenPrincipalUrl && (
          <div className="relative mb-3 h-32 w-32 overflow-hidden rounded-md border border-gray-200">
            <Image src={imagenPrincipalUrl} alt="Imagen principal" fill className="object-cover" unoptimized />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={subiendoPrincipal}
          onChange={(e) => handlePrincipalFile(e.target.files?.[0] ?? null)}
          className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
        {subiendoPrincipal && <p className="mt-1 text-xs text-gray-400">Subiendo...</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Galería de imágenes</h3>
        <div className="space-y-3">
          {galeria.map((img, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-md border p-2 ${img.toDelete ? "border-red-200 bg-red-50 opacity-60" : "border-gray-200"}`}
            >
              {img.url ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-gray-200">
                  <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-gray-200 text-xs text-gray-400">
                  {img.uploading ? "..." : "?"}
                </div>
              )}
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={img.descripcion}
                onChange={(e) => updateGaleriaDescripcion(idx, e.target.value)}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => toggleGaleriaDelete(idx)}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                {img.toDelete ? "Deshacer" : "Quitar"}
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleGaleriaFile(e.target.files?.[0] ?? null)}
          className="mt-3 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : producto ? "Actualizar producto" : "Crear producto"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
