import BarList from "@/components/dashboard/BarList";
import StatCard from "@/components/dashboard/StatCard";
import { adminApiGet } from "@/lib/api-admin";
import type { DashboardStats } from "@/lib/dashboard-types";
import { formatPrecio } from "@/lib/orderStatus";

export default async function DashboardHomePage() {
  const stats = await adminApiGet<DashboardStats>("/api/dashboard/stats/");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Productos" value={stats.total_productos} />
        <StatCard label="Pedidos" value={stats.total_pedidos} />
        <StatCard label="Clientes" value={stats.total_clientes} />
        <StatCard label="Categorías" value={stats.total_categorias} />
        <StatCard label="Ventas totales" value={stats.total_ventas} />
        <StatCard
          label="Ingresos totales"
          value={formatPrecio(stats.ingresos_totales)}
          accent="text-green-700"
        />
        <StatCard label="Conversión" value={`${stats.conversion}%`} accent="text-blue-700" />
        <StatCard label="Vistas de producto" value={stats.total_vistas} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Top productos vendidos
          </h2>
          <BarList
            items={stats.top_productos.map((p) => ({ label: p.product__nombre, value: p.total }))}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Top productos más vistos
          </h2>
          <BarList
            items={stats.top_vistos.map((p) => ({ label: p.product__nombre, value: p.total }))}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Ingresos por día (mes actual)
          </h2>
          <BarList
            items={stats.ventas_por_dia.map((d) => ({ label: d.dia, value: d.total }))}
            formatValue={(v) => formatPrecio(v)}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Ventas de esta semana
          </h2>
          <BarList
            items={stats.dias_semana_actual.map((d) => ({ label: d.dia, value: d.total }))}
            formatValue={(v) => formatPrecio(v)}
          />
        </div>
      </div>

      {stats.ventas_hoy.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Ventas de hoy por hora
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Hora</th>
                  <th className="py-2 pr-4">Ventas</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.ventas_hoy.map((h) => (
                  <tr key={h.hora} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{h.hora}</td>
                    <td className="py-2 pr-4">{h.count}</td>
                    <td className="py-2 font-medium">{formatPrecio(h.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
