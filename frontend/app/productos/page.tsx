import Link from "next/link";

import CatalogProductCard from "@/components/product/CatalogProductCard";
import FiltrosSidebar from "@/components/product/FiltrosSidebar";
import OrdenSelect from "@/components/product/OrdenSelect";
import { apiGet } from "@/lib/api";
import type { Categoria, PaginatedResponse, ProductoResumen } from "@/lib/types";

// Debe coincidir con REST_FRAMEWORK.PAGE_SIZE en backend/electrohome/settings/base.py.
const PAGE_SIZE = 8;

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

  const currentPage = Number(params.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(productos.count / PAGE_SIZE));

  const buildPageUrl = (page: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    return `/productos?${next.toString()}`;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center text-sm text-gray-600 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
          Inicio
        </Link>
        <i className="fas fa-chevron-right mx-2 text-xs" />
        <span className="font-semibold text-blue-600 dark:text-blue-400">Productos</span>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300">
            <i className="fas fa-th-large" /> Nuestros Productos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {productos.count} producto{productos.count === 1 ? "" : "s"} encontrado
            {productos.count === 1 ? "" : "s"}
          </p>
        </div>
        <OrdenSelect />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <FiltrosSidebar categorias={categorias} />
        </aside>

        <div className="lg:col-span-3">
          {productos.results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {productos.results.map((producto) => (
                  <CatalogProductCard key={producto.id} producto={producto} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  {currentPage > 1 && (
                    <>
                      <Link
                        href={buildPageUrl(1)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 transition hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <i className="fas fa-angle-double-left" />
                      </Link>
                      <Link
                        href={buildPageUrl(currentPage - 1)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 transition hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <i className="fas fa-angle-left" />
                      </Link>
                    </>
                  )}
                  <span className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white">
                    {currentPage} de {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <>
                      <Link
                        href={buildPageUrl(currentPage + 1)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 transition hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <i className="fas fa-angle-right" />
                      </Link>
                      <Link
                        href={buildPageUrl(totalPages)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 transition hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <i className="fas fa-angle-double-right" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow-lg dark:bg-slate-800">
              <i className="fas fa-box-open mb-4 text-6xl text-gray-300 dark:text-slate-600" />
              <h3 className="mb-2 text-2xl font-bold text-gray-800 dark:text-slate-100">No se encontraron productos</h3>
              <p className="mb-6 text-gray-600 dark:text-slate-400">Intenta ajustar los filtros o buscar algo diferente</p>
              <Link
                href="/productos"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Ver todos los productos
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
