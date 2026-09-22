"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Categoria } from "@/lib/types";

interface Overrides {
  categoria?: string;
  disponible?: boolean;
}

interface Props {
  /** Sin categorías (undefined/[]) se oculta esa sección — /buscar no filtra por categoría. */
  categorias?: Categoria[];
  /** /buscar ya excluye productos sin stock siempre, el checkbox no aportaría nada ahí. */
  showDisponible?: boolean;
  /** Permite reutilizar el mismo sidebar en /productos y en /buscar. */
  basePath?: string;
}

// Reproduce el filter-form de products_list.html: radios de categoría y el
// checkbox de disponibilidad navegan de inmediato (equivalente a
// onchange="this.form.submit()"); el rango de precio solo se aplica con el
// botón "Aplicar Filtros".
export default function FiltrosSidebar({ categorias = [], showDisponible = true, basePath = "/productos" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categoria, setCategoria] = useState(searchParams.get("categoria") ?? "");
  const [precioMin, setPrecioMin] = useState(searchParams.get("precio_min") ?? "");
  const [precioMax, setPrecioMax] = useState(searchParams.get("precio_max") ?? "");
  const [disponible, setDisponible] = useState(searchParams.get("disponible") === "1");
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set());

  const q = searchParams.get("q");

  const navegar = (overrides: Overrides) => {
    const cat = overrides.categoria ?? categoria;
    const disp = overrides.disponible ?? disponible;

    const next = new URLSearchParams();
    if (cat) next.set("categoria", cat);
    if (q) next.set("q", q);
    if (precioMin) next.set("precio_min", precioMin);
    if (precioMax) next.set("precio_max", precioMax);
    if (disp) next.set("disponible", "1");
    const orden = searchParams.get("orden");
    if (orden) next.set("orden", orden);

    router.push(`${basePath}?${next.toString()}`);
  };

  const toggle = (id: number) => {
    setAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  };

  return (
    <div className="sticky top-24 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="mb-4 flex items-center text-xl font-bold text-blue-800 dark:text-blue-300">
        <i className="fas fa-filter mr-2" /> Filtros
      </h2>

      {categorias.length > 0 && (
      <div className="mb-6">
        <h3 className="mb-3 font-bold text-gray-800 dark:text-slate-200">Categorías</h3>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center rounded p-2 hover:bg-gray-50 dark:hover:bg-slate-700">
            <input
              type="radio"
              name="categoria"
              checked={categoria === ""}
              onChange={() => {
                setCategoria("");
                navegar({ categoria: "" });
              }}
              className="mr-2"
            />
            <span className="font-semibold text-gray-700 dark:text-slate-300">Todas</span>
          </label>

          {categorias.map((cat) => (
            <div key={cat.id}>
              {cat.subcategorias.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className="flex w-full items-center justify-between rounded p-2 transition hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="categoria"
                        checked={categoria === String(cat.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => {
                          setCategoria(String(cat.id));
                          navegar({ categoria: String(cat.id) });
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{cat.nombre}</span>
                    </div>
                    <i
                      className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${
                        abiertas.has(cat.id) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {abiertas.has(cat.id) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-100 pl-4 dark:border-blue-900">
                      <label className="flex cursor-pointer items-center rounded p-2 hover:bg-blue-50 dark:hover:bg-slate-700">
                        <input
                          type="radio"
                          name="categoria"
                          checked={categoria === String(cat.id)}
                          onChange={() => {
                            setCategoria(String(cat.id));
                            navegar({ categoria: String(cat.id) });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Todas las de {cat.nombre}</span>
                      </label>
                      {cat.subcategorias.map((sub) => (
                        <label key={sub.id} className="flex cursor-pointer items-center rounded p-2 hover:bg-blue-50 dark:hover:bg-slate-700">
                          <input
                            type="radio"
                            name="categoria"
                            checked={categoria === String(sub.id)}
                            onChange={() => {
                              setCategoria(String(sub.id));
                              navegar({ categoria: String(sub.id) });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600 dark:text-slate-400">↳ {sub.nombre}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <label className="flex cursor-pointer items-center rounded p-2 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <input
                    type="radio"
                    name="categoria"
                    checked={categoria === String(cat.id)}
                    onChange={() => {
                      setCategoria(String(cat.id));
                      navegar({ categoria: String(cat.id) });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{cat.nombre}</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      <div className="mb-6">
        <h3 className="mb-3 font-bold text-gray-800 dark:text-slate-200">Rango de Precio</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-slate-400">Mínimo</label>
            <input
              type="number"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              placeholder="Mínimo"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-slate-400">Máximo</label>
            <input
              type="number"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              placeholder="Máximo"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {showDisponible && (
      <div className="mb-6">
        <label className="flex cursor-pointer items-center rounded p-2 hover:bg-gray-50 dark:hover:bg-slate-700">
          <input
            type="checkbox"
            checked={disponible}
            onChange={(e) => {
              setDisponible(e.target.checked);
              navegar({ disponible: e.target.checked });
            }}
            className="mr-2"
          />
          <span className="font-semibold text-gray-700 dark:text-slate-300">Solo disponibles</span>
        </label>
      </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navegar({})}
          className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white transition hover:bg-blue-700"
        >
          Aplicar Filtros
        </button>
        <Link
          href={q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath}
          className="block w-full rounded-lg bg-gray-200 py-2 text-center font-bold text-gray-700 transition hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Limpiar Filtros
        </Link>
      </div>
    </div>
  );
}
