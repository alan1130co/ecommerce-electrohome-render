import ProductCard from "@/components/product/ProductCard";
import { apiGet } from "@/lib/api";
import type { SearchResults } from "@/lib/types";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  const results = q
    ? await apiGet<SearchResults>(`/api/search/?q=${encodeURIComponent(q)}`, 0)
    : { query: "", total_results: 0, productos: [], sugerencias: [] };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800">
        {q ? (
          <>
            Resultados para &quot;{q}&quot;
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({results.total_results} {results.total_results === 1 ? "producto" : "productos"})
            </span>
          </>
        ) : (
          "Escribe algo para buscar"
        )}
      </h1>

      {q && results.productos.length === 0 && (
        <div className="mt-6">
          <p className="text-gray-500">No encontramos productos que coincidan con tu búsqueda.</p>

          {results.sugerencias.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-4 text-lg font-bold text-gray-800">Quizás te interese</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {results.sugerencias.map((p) => (
                  <ProductCard key={p.id} producto={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {results.productos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {results.productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </main>
  );
}
