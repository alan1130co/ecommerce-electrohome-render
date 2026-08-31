import Image from "next/image";
import Link from "next/link";

import AdminPagination from "@/components/dashboard/AdminPagination";
import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, ProductoAdmin } from "@/lib/dashboard-types";
import { formatPrecio } from "@/lib/orderStatus";

export default async function ProductosPage(props: PageProps<"/dashboard/productos">) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const data = await adminApiGet<AdminPage<ProductoAdmin>>(`/api/dashboard/productos/?${params.toString()}`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Productos <span className="text-base font-normal text-gray-500">({data.count})</span>
        </h1>
        <Link
          href="/dashboard/productos/nuevo"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="flex items-center gap-3 px-4 py-3">
                  {p.imagen_principal ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200">
                      <Image src={p.imagen_principal} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded border border-gray-200 bg-gray-50" />
                  )}
                  <span className="font-medium text-gray-800">{p.nombre}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.categoria_nombre}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatPrecio(p.precio)}</td>
                <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/productos/${p.id}/editar`}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      endpoint={`/api/dashboard/productos/${p.id}/`}
                      confirmMessage={`¿Eliminar el producto "${p.nombre}"? Esta acción no se puede deshacer.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No hay productos todavía.
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
        basePath="/dashboard/productos"
        searchParams={{}}
      />
    </div>
  );
}
