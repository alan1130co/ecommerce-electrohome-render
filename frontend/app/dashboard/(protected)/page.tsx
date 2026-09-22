import IngresosChart from "@/components/dashboard/IngresosChart";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import StatCard from "@/components/dashboard/StatCard";
import { adminApiGet } from "@/lib/api-admin";
import type { DashboardStats } from "@/lib/dashboard-types";
import { formatPrecio } from "@/lib/orderStatus";

const REPORTES = [
  { tipo: "diario", label: "Diario" },
  { tipo: "semanal", label: "Semanal" },
  { tipo: "mensual", label: "Mensual" },
] as const;

const QUICK_LINKS = (stats: DashboardStats) =>
  [
    {
      href: "/dashboard/productos",
      color: "blue" as const,
      emoji: "📦",
      title: "Productos",
      subtitle: "Administrar catálogo",
      badge: stats.total_productos,
    },
    {
      href: "/dashboard/categorias",
      color: "yellow" as const,
      emoji: "📋",
      title: "Categorías",
      subtitle: "Organizar catálogo",
      badge: stats.total_categorias,
    },
    {
      href: "/dashboard/pedidos",
      color: "green" as const,
      emoji: "🛒",
      title: "Pedidos",
      subtitle: "Revisar órdenes",
      badge: stats.total_pedidos,
    },
    {
      href: "/dashboard/usuarios",
      color: "red" as const,
      emoji: "👥",
      title: "Usuarios",
      subtitle: "Gestión clientes",
      badge: stats.total_clientes,
    },
    {
      href: "/dashboard/resenas",
      color: "purple" as const,
      emoji: "⭐",
      title: "Reseñas",
      subtitle: "Moderar opiniones",
      alert: stats.resenas_pendientes > 0,
    },
    {
      href: "/dashboard/promociones",
      color: "orange" as const,
      emoji: "🏷️",
      title: "Promociones",
      subtitle: "Descuentos y ofertas",
    },
    {
      href: "/dashboard/secciones",
      color: "cyan" as const,
      emoji: "🖼️",
      title: "Secciones",
      subtitle: "Banners del home",
    },
    {
      href: "/dashboard/envio-masivo",
      color: "indigo" as const,
      emoji: "📧",
      title: "Envío Masivo",
      subtitle: "Correos a clientes",
    },
  ] as const;

export default async function DashboardHomePage() {
  const stats = await adminApiGet<DashboardStats>("/api/dashboard/stats/");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-chart-line text-amber-500" /> Panel de Control
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Resumen general de ElectroHome</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {REPORTES.map((r) => (
            <a
              key={r.tipo}
              href={`/api/dashboard/reportes/pdf/?tipo=${r.tipo}`}
              className="rounded-lg bg-linear-to-br from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <i className="fas fa-file-pdf mr-1" /> {r.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS(stats).map((item) => (
          <QuickAccessCard key={item.href} {...item} />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="fa-shopping-bag" color="blue" label="Total Ventas" value={stats.total_ventas} />
        <StatCard
          icon="fa-dollar-sign"
          color="green"
          label="Ingresos"
          value={formatPrecio(stats.ingresos_totales)}
          small
        />
        <StatCard
          icon="fa-chart-pie"
          color="amber"
          label="Conversión"
          value={`${String(stats.conversion).replace(".", ",")}%`}
        />
        <StatCard icon="fa-eye" color="cyan" label="Vistas" value={stats.total_vistas} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
          <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
            <i className="fas fa-trophy mr-2 text-amber-500" /> Productos Más Vendidos
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-2 font-semibold">Producto</th>
                <th className="px-5 py-2 text-right font-semibold">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_productos.map((p) => (
                <tr key={p.product__nombre} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-5 py-3 text-gray-800 dark:text-slate-200">{p.product__nombre}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                      {p.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
          <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
            <i className="fas fa-eye mr-2 text-amber-500" /> Productos Más Vistos
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-2 font-semibold">Producto</th>
                <th className="px-5 py-2 text-right font-semibold">Vistas</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_vistos.map((p) => (
                <tr key={p.product__nombre} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-5 py-3 text-gray-800 dark:text-slate-200">{p.product__nombre}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="rounded-full bg-blue-700/10 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {p.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
        <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
          <i className="fas fa-chart-line mr-2 text-amber-500" /> Ingresos del Mes Actual
        </div>
        <div className="p-4">
          <IngresosChart data={stats.ventas_por_dia} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
          <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
            <i className="fas fa-clock mr-2 text-amber-500" /> Ventas de Hoy
          </div>
          <div className="max-h-65 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-2 font-semibold">Hora</th>
                  <th className="px-5 py-2 text-center font-semibold">Pedidos</th>
                  <th className="px-5 py-2 text-right font-semibold">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {stats.ventas_hoy.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400 dark:text-slate-500">
                      Sin ventas hoy
                    </td>
                  </tr>
                ) : (
                  stats.ventas_hoy.map((h) => (
                    <tr key={h.hora} className="border-t border-gray-100 dark:border-slate-700">
                      <td className="px-5 py-3 text-gray-800 dark:text-slate-200">{h.hora}</td>
                      <td className="px-5 py-3 text-center text-gray-600 dark:text-slate-400">{h.count}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatPrecio(h.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
          <div className="bg-linear-to-br from-slate-900 to-blue-900 px-5 py-4 text-[15px] font-bold text-white">
            <i className="fas fa-chart-bar mr-2 text-amber-500" /> Ventas de la Semana Actual
          </div>
          <div className="p-4">
            <IngresosChart data={stats.dias_semana_actual} height={260} />
          </div>
        </div>
      </div>
    </div>
  );
}
