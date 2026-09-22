import Image from "next/image";
import Link from "next/link";

import ConfirmDeleteButton from "@/components/dashboard/ConfirmDeleteButton";
import ToggleBannerButton from "@/components/dashboard/ToggleBannerButton";
import { adminApiGet } from "@/lib/api-admin";
import type { BannerAdmin, PromocionAdmin } from "@/lib/dashboard-types";
import { formatFechaSolo, formatPrecio } from "@/lib/orderStatus";

const iconBtn = "rounded-lg px-2.5 py-1.5 text-sm text-white";

function estadoHome(promo: PromocionAdmin) {
  if (promo.vigente) return { label: "🟢 En home", cls: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" };
  if (!promo.activo) return { label: "⚪ Inactiva", cls: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400" };
  const hoy = new Date().toISOString().slice(0, 10);
  if (promo.fecha_fin < hoy) return { label: "🔴 Expirada", cls: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300" };
  return { label: "🟡 Próxima", cls: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" };
}

export default async function SeccionesPage() {
  const data = await adminApiGet<{ promociones: PromocionAdmin[]; banners: BannerAdmin[] }>(
    "/api/dashboard/secciones/",
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-layer-group text-amber-500" /> Secciones del Home
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Controla banners y productos en oferta que aparecen en el home</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/secciones/banners/nuevo"
            className="rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            <i className="fas fa-image mr-1" /> Nuevo Banner
          </Link>
          <Link
            href="/dashboard/promociones/nueva"
            className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <i className="fas fa-tag mr-1" /> Nueva Oferta
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-image text-amber-500" /> Banners del Home
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
            {data.banners.length} banner{data.banners.length === 1 ? "" : "s"}
          </span>
        </h2>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Imagen</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">URL destino</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.banners.map((banner) => (
                <tr key={banner.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      #{banner.orden}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {banner.imagen ? (
                      <div className="relative h-11.25 w-20 overflow-hidden rounded-md border border-gray-200 dark:border-slate-600">
                        <Image src={banner.imagen} alt={banner.titulo} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="flex h-11.25 w-20 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        Sin imagen
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <strong className="text-blue-900 dark:text-blue-300">{banner.titulo}</strong>
                    {banner.subtitulo && <div className="text-xs text-slate-400">{banner.subtitulo}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                      {banner.url_destino}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <ToggleBannerButton bannerId={banner.id} activo={banner.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/secciones/banners/${banner.id}/editar`}
                        title="Editar"
                        className={`${iconBtn} bg-linear-to-br from-blue-700 to-blue-900`}
                      >
                        <i className="fas fa-edit" />
                      </Link>
                      <ConfirmDeleteButton
                        endpoint={`/api/dashboard/banners/${banner.id}/`}
                        confirmMessage={`¿Eliminar el banner "${banner.titulo}"?`}
                        label={<i className="fas fa-trash" />}
                        className={`${iconBtn} bg-linear-to-br from-red-500 to-red-600 disabled:opacity-50`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {data.banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                    No hay banners.{" "}
                    <Link href="/dashboard/secciones/banners/nuevo" className="text-blue-700 hover:underline dark:text-blue-400">
                      Crear uno
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-tag text-red-500" /> Productos en &quot;Ofertas Especiales&quot;
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">
            Sección del home
          </span>
        </h2>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-500/6 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
          <i className="fas fa-info-circle" />
          Los productos con promoción <strong>activa y vigente</strong> aparecen automáticamente en la sección{" "}
          <strong>&quot;Ofertas Especiales&quot;</strong> del home. Para añadir un producto, crea una promoción desde{" "}
          <Link href="/dashboard/promociones/nueva" className="font-bold text-blue-700 hover:underline dark:text-blue-400">
            Promociones → Nueva Promoción
          </Link>
          .
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Etiqueta</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Precio original</th>
                <th className="px-4 py-3">Precio promo</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado home</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.promociones.map((promo) => {
                const estado = estadoHome(promo);
                return (
                  <tr key={promo.id} className="border-t border-gray-100 dark:border-slate-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {promo.producto_imagen && (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-slate-600">
                            <Image
                              src={promo.producto_imagen}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <strong className="text-blue-900 dark:text-blue-300">{promo.producto_nombre}</strong>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                        {promo.etiqueta}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                        {promo.descuento_porcentaje.replace(".", ",")}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 line-through dark:text-slate-500">{formatPrecio(promo.producto_precio)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrecio(promo.precio_promocional ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                      {formatFechaSolo(promo.fecha_inicio)} → {formatFechaSolo(promo.fecha_fin)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estado.cls}`}>
                        {estado.label}
                      </span>
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
              {data.promociones.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                    No hay promociones activas.{" "}
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
    </div>
  );
}
