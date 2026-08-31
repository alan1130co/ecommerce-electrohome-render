import Link from "next/link";

import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import { adminApiGet } from "@/lib/api-admin";
import type { PromocionAdmin } from "@/lib/dashboard-types";
import { formatFecha } from "@/lib/orderStatus";

export default async function PromocionesPage() {
  const promociones = await adminApiGet<PromocionAdmin[]>("/api/dashboard/promociones/");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Promociones <span className="text-base font-normal text-gray-500">({promociones.length})</span>
        </h1>
        <Link
          href="/dashboard/promociones/nueva"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nueva promoción
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo) => (
              <tr key={promo.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{promo.producto_nombre}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {promo.etiqueta}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{promo.descuento_porcentaje}%</td>
                <td className="px-4 py-3 text-gray-500">
                  {formatFecha(promo.fecha_inicio)} — {formatFecha(promo.fecha_fin)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      promo.vigente ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {promo.vigente ? "Vigente" : promo.activo ? "Activa (fuera de fecha)" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/promociones/${promo.id}/editar`}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      endpoint={`/api/dashboard/promociones/${promo.id}/`}
                      confirmMessage={`¿Eliminar la promoción de "${promo.producto_nombre}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {promociones.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No hay promociones todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
