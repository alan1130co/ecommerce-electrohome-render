import CatalogProductCard from "@/components/product/CatalogProductCard";
import FiltrosSidebar from "@/components/product/FiltrosSidebar";
import OrdenSelect from "@/components/product/OrdenSelect";
import { apiGet } from "@/lib/api";
import type { SearchResults } from "@/lib/types";

const FILTER_KEYS = ["q", "precio_min", "precio_max", "orden"] as const;

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = sp[key];
    if (typeof value === "string" && value) params.set(key, value);
  }

  const results = q
    ? await apiGet<SearchResults>(`/api/search/?${params.toString()}`, 0)
    : { query: "", total_results: 0, productos: [], sugerencias: [] };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-slate-100">
            <i className="fas fa-search text-blue-600 dark:text-blue-400" />
            Resultados de búsqueda
          </h1>
          {q && (
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              Mostrando <span className="font-semibold text-blue-600 dark:text-blue-400">{results.total_results}</span>{" "}
              {results.total_results === 1 ? "resultado" : "resultados"} para{" "}
              <span className="font-semibold text-gray-800 dark:text-slate-200">&quot;{q}&quot;</span>
            </p>
          )}
        </div>
        {q && results.productos.length > 0 && <OrdenSelect basePath="/buscar" />}
      </div>

      {!q && <p className="text-gray-500 dark:text-slate-400">Escribe algo para buscar</p>}

      {q && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <FiltrosSidebar basePath="/buscar" showDisponible={false} />
          </aside>

          <div className="lg:col-span-3">
            {results.productos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.productos.map((p) => (
                  <CatalogProductCard key={p.id} producto={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow-lg dark:bg-slate-800">
                <i className="fas fa-search mb-4 text-6xl text-gray-300 dark:text-slate-600" />
                <h3 className="mb-2 text-2xl font-bold text-gray-800 dark:text-slate-100">
                  No encontramos productos que coincidan con tu búsqueda
                </h3>
                <p className="mb-6 text-gray-600 dark:text-slate-400">Intenta con otras palabras o revisa la ortografía</p>

                {results.sugerencias.length > 0 && (
                  <div className="mt-8 text-left">
                    <h4 className="mb-4 text-lg font-bold text-gray-800 dark:text-slate-100">Quizás te interese</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {results.sugerencias.map((p) => (
                        <CatalogProductCard key={p.id} producto={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
