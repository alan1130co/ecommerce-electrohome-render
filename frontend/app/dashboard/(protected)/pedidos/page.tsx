import AdminPagination from "@/components/dashboard/AdminPagination";
import CambiarEstadoPedido from "@/components/dashboard/CambiarEstadoPedido";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, OrderAdmin } from "@/lib/dashboard-types";
import { formatFecha, formatPrecio, statusColor } from "@/lib/orderStatus";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

const REPORTES = [
  { tipo: "diario", label: "Reporte diario" },
  { tipo: "semanal", label: "Reporte semanal" },
  { tipo: "mensual", label: "Reporte mensual" },
] as const;

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Pedidos <span className="text-base font-normal text-gray-500">({data.count})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {REPORTES.map((r) => (
            // Descarga directa vía navegador — el navegador manda la cookie de
            // sesión sola (mismo origen a través del rewrite de next.config.ts),
            // no hace falta JS ni fetch acá.
            <a
              key={r.tipo}
              href={`/api/dashboard/reportes/pdf/?tipo=${r.tipo}`}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {r.label} (PDF)
            </a>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {ESTADOS.map((e) => (
          <a
            key={e.value}
            href={e.value ? `/dashboard/pedidos?status=${e.value}` : "/dashboard/pedidos"}
            className={`rounded-full border px-3 py-1 ${
              status === e.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 text-gray-600 hover:border-blue-400"
            }`}
          >
            {e.label}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((pedido) => (
              <tr key={pedido.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">#{pedido.order_number}</td>
                <td className="px-4 py-3 text-gray-600">
                  {pedido.user_nombre}
                  <div className="text-xs text-gray-400">{pedido.user_email ?? pedido.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatPrecio(pedido.total)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(pedido.status)}`}>
                    {pedido.status_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(pedido.created_at)}</td>
                <td className="px-4 py-3">
                  <CambiarEstadoPedido pedidoId={pedido.id} status={pedido.status} />
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
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
