import Link from "next/link";

import AdminPagination from "@/components/dashboard/AdminPagination";
import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, CategoriaAdmin } from "@/lib/dashboard-types";

export default async function CategoriasPage(props: PageProps<"/dashboard/categorias">) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const data = await adminApiGet<AdminPage<CategoriaAdmin>>(`/api/dashboard/categorias/?${params.toString()}`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Categorías <span className="text-base font-normal text-gray-500">({data.count})</span>
        </h1>
        <Link
          href="/dashboard/categorias/nueva"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nueva categoría
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{cat.nombre}</td>
                <td className="px-4 py-3 text-gray-500">
                  {cat.es_subcategoria ? "Subcategoría" : cat.es_categoria_padre ? "Categoría padre" : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{cat.total_productos}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      cat.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/categorias/${cat.id}/editar`}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      endpoint={`/api/dashboard/categorias/${cat.id}/`}
                      confirmMessage={`¿Eliminar la categoría "${cat.nombre}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No hay categorías todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={data.current_page}
        numPages={data.num_pages}
        hasNext={data.has_next}
        hasPrevious={data.has_previous}
        basePath="/dashboard/categorias"
        searchParams={{}}
      />
    </div>
  );
}
