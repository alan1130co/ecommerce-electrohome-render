import Link from "next/link";

import AdminPagination from "@/components/dashboard/AdminPagination";
import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, ProductoAdmin } from "@/lib/dashboard-types";
import { formatFechaCorta, formatPrecio } from "@/lib/orderStatus";

const iconBtn = "rounded-lg px-2.5 py-1.5 text-sm text-white";

function Badge({ color, children }: { color: "blue" | "cyan" | "green"; children: React.ReactNode }) {
  const colors = {
    blue: "bg-blue-700/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    cyan: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    green: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[color]}`}>{children}</span>
  );
}

export default async function ProductosPage(props: PageProps<"/dashboard/productos">) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const data = await adminApiGet<AdminPage<ProductoAdmin>>(`/api/dashboard/productos/?${params.toString()}`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-box text-amber-500" /> Productos
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Total: {data.count} productos registrados</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
          >
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/productos/nuevo"
            className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            + Crear Producto
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <Badge color="blue">#{p.id}</Badge>
                </td>
                <td className="px-4 py-3 font-bold text-blue-900 dark:text-blue-300">{p.nombre}</td>
                <td className="px-4 py-3">
                  <Badge color="cyan">{p.categoria_nombre}</Badge>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatPrecio(p.precio)}</td>
                <td className="px-4 py-3">
                  <Badge color="green">{p.stock} u.</Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.activo
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFechaCorta(p.fecha_creacion)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/productos/${p.id}/editar`}
                      title="Editar"
                      className={`${iconBtn} bg-linear-to-br from-blue-700 to-blue-900`}
                    >
                      <i className="fas fa-edit" />
                    </Link>
                    <ConfirmDeleteButton
                      endpoint={`/api/dashboard/productos/${p.id}/`}
                      confirmMessage={`¿Eliminar el producto "${p.nombre}"? Esta acción no se puede deshacer.`}
                      label={<i className="fas fa-trash" />}
                      className={`${iconBtn} bg-linear-to-br from-red-500 to-red-600 disabled:opacity-50`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
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
