import Link from "next/link";

import AdminPagination from "@/components/dashboard/AdminPagination";
import CambiarEstadoPedido from "@/components/dashboard/CambiarEstadoPedido";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, OrderAdmin } from "@/lib/dashboard-types";
import { formatFecha, formatPrecio } from "@/lib/orderStatus";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente", activeClass: "bg-amber-500/90 text-slate-900", idleClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
  { value: "processing", label: "Procesando", activeClass: "bg-cyan-500/90 text-slate-900", idleClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" },
  { value: "shipped", label: "Enviado", activeClass: "bg-blue-500/90 text-slate-900", idleClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  { value: "delivered", label: "Entregado", activeClass: "bg-emerald-500/90 text-slate-900", idleClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { value: "cancelled", label: "Cancelado", activeClass: "bg-red-500/90 text-slate-900", idleClass: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
] as const;

const ESTADO_BADGE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  processing: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  shipped: "bg-blue-700/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

export default async function PedidosPage(props: PageProps<"/dashboard/pedidos">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page);

  const data = await adminApiGet<AdminPage<OrderAdmin> & { estado_filtro: string }>(
    `/api/dashboard/pedidos/?${params.toString()}`,
  );

  const filtroLabel = ESTADOS.find((e) => e.value === status)?.label;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-shopping-cart text-amber-500" /> Pedidos
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Total: <strong>{data.count}</strong>
            {status && (
              <>
                {" "}
                — filtrando por <strong>{filtroLabel}</strong>
              </>
            )}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const isActive = status === e.value;
          const cls =
            e.value === ""
              ? isActive
                ? "bg-linear-to-br from-slate-900 to-blue-900 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
              : isActive
                ? e.activeClass
                : e.idleClass;
          return (
            <Link
              key={e.value}
              href={e.value ? `/dashboard/pedidos?status=${e.value}` : "/dashboard/pedidos"}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${cls}`}
            >
              {e.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((pedido) => (
              <tr key={pedido.id} className="border-t border-gray-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-700/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    #{pedido.order_number}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-blue-900 dark:text-blue-300">{pedido.user_nombre}</td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${pedido.user_email ?? pedido.email}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {pedido.user_email ?? pedido.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_BADGE[pedido.status] ?? "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"}`}
                  >
                    {pedido.status_display}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatPrecio(pedido.total)}</td>
                <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFecha(pedido.created_at)}</td>
                <td className="px-4 py-3">
                  <CambiarEstadoPedido
                    pedidoId={pedido.id}
                    orderNumber={pedido.order_number}
                    status={pedido.status}
                  />
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                  No hay pedidos con este filtro.
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
        basePath="/dashboard/pedidos"
        searchParams={{ status }}
      />
    </div>
  );
}
