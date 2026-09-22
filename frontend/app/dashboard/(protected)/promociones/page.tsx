import Link from "next/link";

import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import { adminApiGet } from "@/lib/api-admin";
import type { PromocionAdmin } from "@/lib/dashboard-types";
import { formatFechaSolo, formatPrecio } from "@/lib/orderStatus";

const iconBtn = "rounded-lg px-2.5 py-1.5 text-sm text-white";

const comaDecimal = (valor: string) => valor.replace(".", ",");

function estadoBadge(promo: PromocionAdmin) {
  if (promo.vigente) return { label: "Activa", cls: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" };
  if (!promo.activo) return { label: "Inactiva", cls: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400" };
  const hoy = new Date().toISOString().slice(0, 10);
  if (promo.fecha_fin < hoy) return { label: "Expirada", cls: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" };
  return { label: "Próxima", cls: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" };
}

export default async function PromocionesPage() {
  const promociones = await adminApiGet<PromocionAdmin[]>("/api/dashboard/promociones/");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-tag text-amber-500" /> Promociones
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Gestión de descuentos y ofertas</p>
        </div>
        <Link
          href="/dashboard/promociones/nueva"
          className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          + Nueva Promoción
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Precio Original</th>
              <th className="px-4 py-3">Precio Promo</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo) => {
              const estado = estadoBadge(promo);
              return (
                <tr key={promo.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-4 py-3 font-bold text-blue-900 dark:text-blue-300">{promo.producto_nombre}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                      {promo.etiqueta}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                      {comaDecimal(promo.descuento_porcentaje)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 line-through dark:text-slate-500">{formatPrecio(promo.producto_precio)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrecio(promo.precio_promocional ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFechaSolo(promo.fecha_inicio)}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFechaSolo(promo.fecha_fin)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estado.cls}`}>{estado.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/promociones/${promo.id}/editar`}
                        title="Editar"
                        className={`${iconBtn} bg-linear-to-br from-blue-700 to-blue-900`}
                      >
                        <i className="fas fa-edit" />
                      </Link>
                      <ConfirmDeleteButton
                        endpoint={`/api/dashboard/promociones/${promo.id}/`}
                        confirmMessage={`¿Eliminar la promoción de "${promo.producto_nombre}"?`}
                        label={<i className="fas fa-trash" />}
                        className={`${iconBtn} bg-linear-to-br from-red-500 to-red-600 disabled:opacity-50`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {promociones.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                  No hay promociones.{" "}
                  <Link href="/dashboard/promociones/nueva" className="text-blue-700 hover:underline dark:text-blue-400">
                    Crear una
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
