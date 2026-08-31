import Link from "next/link";

import ProductCard from "@/components/product/ProductCard";
import { apiGet } from "@/lib/api";
import type { Categoria, PaginatedResponse, ProductoResumen } from "@/lib/types";

const ORDEN_OPCIONES: { value: string; label: string }[] = [
  { value: "-fecha_creacion", label: "Más recientes" },
  { value: "fecha_creacion", label: "Más antiguos" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "nombre_asc", label: "Nombre A-Z" },
];

const FILTER_KEYS = [
  "categoria",
  "q",
  "precio_min",
  "precio_max",
  "disponible",
  "orden",
  "page",
] as const;

export default async function ProductosPage(props: PageProps<"/productos">) {
  const sp = await props.searchParams;

  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = sp[key];
    if (typeof value === "string" && value) params.set(key, value);
  }

  const [productos, categorias] = await Promise.all([
    apiGet<PaginatedResponse<ProductoResumen>>(`/api/productos/?${params.toString()}`),
    apiGet<Categoria[]>("/api/categorias/"),
  ]);

  const ordenActual = params.get("orden") ?? "-fecha_creacion";
  const categoriaActual = params.get("categoria");
  const currentPage = Number(params.get("page") ?? "1");

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in overrides)) next.delete("page");
    return `/productos?${next.toString()}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          Categorías
        </h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href={buildUrl({ categoria: undefined })}
              className={`block rounded px-2 py-1 ${
                !categoriaActual
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Todas
            </Link>
          </li>
          {categorias.map((cat) => (
            <li key={cat.id}>
              <Link
                href={buildUrl({ categoria: String(cat.id) })}
                className={`block rounded px-2 py-1 ${
                  categoriaActual === String(cat.id)
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800">
            Nuestros productos
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({productos.count} resultados)
            </span>
          </h1>
          <div className="flex flex-wrap gap-2 text-xs">
            {ORDEN_OPCIONES.map((opcion) => (
              <Link
                key={opcion.value}
                href={buildUrl({ orden: opcion.value })}
                className={`rounded-full border px-3 py-1 ${
                  ordenActual === opcion.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-600 hover:border-blue-400"
                }`}
              >
                {opcion.label}
              </Link>
            ))}
          </div>
        </div>

        {productos.results.length === 0 ? (
          <p className="text-gray-500">No se encontraron productos con estos filtros.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {productos.results.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}

        {(productos.next || productos.previous) && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {productos.previous ? (
              <Link
                href={buildUrl({ page: String(currentPage - 1) })}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-300">
                ← Anterior
              </span>
            )}
            <span className="text-sm text-gray-600">Página {currentPage}</span>
            {productos.next ? (
              <Link
                href={buildUrl({ page: String(currentPage + 1) })}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                Siguiente →
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-300">
                Siguiente →
              </span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
