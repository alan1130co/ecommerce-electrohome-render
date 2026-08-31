import Image from "next/image";
import Link from "next/link";

import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import ToggleBannerButton from "@/components/dashboard/ToggleBannerButton";
import { adminApiGet } from "@/lib/api-admin";
import type { BannerAdmin, PromocionAdmin } from "@/lib/dashboard-types";

export default async function SeccionesPage() {
  const data = await adminApiGet<{ promociones: PromocionAdmin[]; banners: BannerAdmin[] }>(
    "/api/dashboard/secciones/",
  );

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <Link
            href="/dashboard/secciones/banners/nuevo"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            + Nuevo banner
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="relative h-32 w-full bg-gray-100">
                <Image src={banner.imagen} alt={banner.titulo} fill className="object-cover" unoptimized />
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-800">{banner.titulo}</p>
                <p className="text-xs text-gray-500">{banner.subtitulo}</p>
                <div className="mt-3 flex items-center justify-between">
                  <ToggleBannerButton bannerId={banner.id} activo={banner.activo} />
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/secciones/banners/${banner.id}/editar`}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      endpoint={`/api/dashboard/banners/${banner.id}/`}
                      confirmMessage={`¿Eliminar el banner "${banner.titulo}"?`}
                      label="Eliminar"
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.banners.length === 0 && (
            <p className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400">
              No hay banners todavía.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Promociones vigentes por etiqueta</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Etiqueta</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Descuento</th>
              </tr>
            </thead>
            <tbody>
              {data.promociones.map((promo) => (
                <tr key={promo.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {promo.etiqueta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{promo.producto_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{promo.descuento_porcentaje}%</td>
                </tr>
              ))}
              {data.promociones.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No hay promociones activas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
