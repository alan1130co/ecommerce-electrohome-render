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

// Espeja Categoria.objects.order_by('nombre') del template legacy: todas las
// categorías (padres y subcategorías) en una sola lista, ordenadas
// alfabéticamente por su propio nombre — no agrupadas por jerarquía.
function flattenCategorias(categorias: Categoria[]): { id: number; label: string; nombre: string }[] {
  const out: { id: number; label: string; nombre: string }[] = [];
  for (const cat of categorias) {
    out.push({ id: cat.id, label: cat.nombre, nombre: cat.nombre });
    for (const sub of cat.subcategorias) {
      out.push({ id: sub.id, label: `${cat.nombre} > ${sub.nombre}`, nombre: sub.nombre });
    }
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
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
  const [categoriaId, setCategoriaId] = useState(producto ? String(producto.categoria.id) : "");
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
    <form onSubmit={handleSubmit}>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

      <Section icon="fa-info-circle" title="Información Básica">
        <div className="grid gap-4">
          <Field id="p-nombre" label="Nombre del producto" error={errorFor("nombre")}>
            <input
              id="p-nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="p-descripcion" label="Descripción" error={errorFor("descripcion")}>
            <textarea
              id="p-descripcion"
              rows={4}
              placeholder="Descripción completa del producto"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-categoria" label="Categoría" error={errorFor("categoria")}>
              <select
                id="p-categoria"
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={inputClass}
              >
                <option value="">---------</option>
                {categoriaOpciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="p-marca" label="Marca" error={errorFor("marca")}>
              <input
                id="p-marca"
                placeholder="Marca del producto"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon="fa-dollar-sign" title="Precio y Stock">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-precio" label="Precio ($)" error={errorFor("precio")}>
            <input
              id="p-precio"
              required
              type="number"
              step="0.01"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="p-stock" label="Stock" error={errorFor("stock")}>
            <input
              id="p-stock"
              required
              type="number"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section icon="fa-cogs" title="Especificaciones Técnicas">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-capacidad" label="Capacidad" error={errorFor("capacidad")}>
            <input
              id="p-capacidad"
              placeholder="Ej: 100L, 2.5 HP"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="p-potencia" label="Potencia" error={errorFor("potencia")}>
            <input
              id="p-potencia"
              placeholder="Ej: 1500W"
              value={potencia}
              onChange={(e) => setPotencia(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="p-color" label="Color" error={errorFor("color")}>
            <input
              id="p-color"
              placeholder="Color principal"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="p-garantia" label="Garantía (meses)" error={errorFor("garantia_meses")}>
            <input
              id="p-garantia"
              type="number"
              placeholder="12"
              value={garantiaMeses}
              onChange={(e) => setGarantiaMeses(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section icon="fa-images" title="Características e Imagen">
        <div className="space-y-4">
          <Field
            id="p-caracteristicas"
            label="Características Destacadas"
            error={errorFor("caracteristicas_destacadas")}
          >
            <input
              id="p-caracteristicas"
              placeholder="Separa con comas (No Frost, Inverter, Digital)"
              value={caracteristicas}
              onChange={(e) => setCaracteristicas(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Separa con comas. Ej: No Frost, Inverter, Digital</p>
          </Field>

          <div>
            <label className={labelClass}>Imagen Principal</label>
            {imagenPrincipalUrl && (
              <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-md border border-gray-200 dark:border-slate-600">
                <Image src={imagenPrincipalUrl} alt="Imagen principal" fill className="object-cover" unoptimized />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={subiendoPrincipal}
              onChange={(e) => handlePrincipalFile(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-400 dark:file:bg-blue-500/15 dark:file:text-blue-300"
            />
            {subiendoPrincipal && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Subiendo...</p>}
          </div>

          <div>
            <label className={labelClass}>Imágenes Adicionales</label>
            <div className="space-y-3">
              {galeria.map((img, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-[10px] border p-3 ${img.toDelete ? "border-red-200 bg-red-50 opacity-60 dark:border-red-500/30 dark:bg-red-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/40"}`}
                >
                  {img.url ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-slate-600">
                      <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-gray-200 text-xs text-slate-400 dark:border-slate-600">
                      {img.uploading ? "..." : "?"}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={img.descripcion}
                    onChange={(e) => updateGaleriaDescripcion(idx, e.target.value)}
                    className={`${inputClass} flex-1 bg-white dark:bg-slate-700`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleGaleriaDelete(idx)}
                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {img.toDelete ? "Deshacer" : "Quitar"}
                  </button>
                </div>
              ))}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white">
              <i className="fas fa-plus" /> Agregar imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleGaleriaFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </Section>

      <Section icon="fa-toggle-on" title="Estado">
        <label className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          Producto Activo
        </label>
      </Section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-7 py-3 font-semibold text-slate-900 disabled:opacity-50"
        >
          <i className="fas fa-save mr-1" />{" "}
          {submitting ? "Guardando..." : producto ? "Actualizar Producto" : "Crear Producto"}
        </button>
        <a
          href="/dashboard/productos/"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-6 py-3 font-semibold text-white"
        >
          <i className="fas fa-times mr-1" /> Cancelar
        </a>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border-2 border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-700 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-400";

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
      <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
        <i className={`fas ${icon} mr-2 text-amber-500`} /> {title}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
