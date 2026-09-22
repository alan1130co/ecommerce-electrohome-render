import Image from "next/image";
import Link from "next/link";

import AdminPagination from "@/components/dashboard/AdminPagination";
import ResenaModeracion from "@/components/dashboard/ResenaModeracion";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, ResenaAdmin } from "@/lib/dashboard-types";
import { formatFechaLarga } from "@/lib/orderStatus";

const ESTADOS = [
  { value: "pendiente", label: "Pendientes", icon: "fa-clock", activeClass: "bg-[#ffc107] text-black" },
  { value: "aprobada", label: "Aprobadas", icon: "fa-check-circle", activeClass: "bg-[#198754] text-white" },
  { value: "rechazada", label: "Rechazadas", icon: "fa-times-circle", activeClass: "bg-[#dc3545] text-white" },
] as const;

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  aprobada: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  rechazada: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

const ESTADO_ICONO: Record<string, string> = {
  pendiente: "⏳",
  aprobada: "✅",
  rechazada: "❌",
};

const VACIO_SUBTITULO: Record<string, string> = {
  pendiente: "¡Todo al día! No hay reseñas esperando moderación.",
  aprobada: "Aún no hay reseñas aprobadas.",
  rechazada: "No hay reseñas rechazadas.",
};

function iniciales(nombre: string, email: string) {
  return (nombre || email)[0]?.toUpperCase() ?? "?";
}

// Espeja el filtro Django truncatechars:60 — 60 es el largo TOTAL incluyendo
// el carácter de elipsis, no la cantidad de caracteres conservados.
function truncatechars(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

type ResenasResponse = AdminPage<ResenaAdmin> & {
  estado: string;
  conteos: { pendiente: number; aprobada: number; rechazada: number };
};

export default async function ResenasPage(props: PageProps<"/dashboard/resenas">) {
  const sp = await props.searchParams;
  const estado = typeof sp.estado === "string" ? sp.estado : "pendiente";
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams({ estado });
  if (page) params.set("page", page);

  const data = await adminApiGet<ResenasResponse>(`/api/dashboard/resenas/?${params.toString()}`);

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-star text-amber-500" /> Gestión de Reseñas
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Modera las reseñas antes de publicarlas en la tienda</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const isActive = estado === e.value;
          const conteo = data.conteos[e.value];
          const showBadge = e.value !== "pendiente" || conteo > 0;
          return (
            <Link
              key={e.value}
              href={`/dashboard/resenas?estado=${e.value}`}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                isActive
                  ? `border-transparent ${e.activeClass}`
                  : "border-gray-400 text-gray-500 dark:border-slate-600 dark:text-slate-400"
              }`}
            >
              <i className={`fas ${e.icon}`} /> {e.label}
              {showBadge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    e.value === "pendiente"
                      ? "bg-red-600 text-white"
                      : "bg-slate-50 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                >
                  {conteo}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {data.results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.results.map((resena) => {
            const nombre =
              `${resena.usuario_first_name} ${resena.usuario_last_name}`.trim() || resena.usuario_email;
            return (
              <div key={resena.id} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-700 to-blue-900 text-sm font-extrabold text-white">
                      {iniciales(resena.usuario_first_name, resena.usuario_email)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{nombre}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{resena.usuario_email}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <small className="text-gray-500 dark:text-slate-400">{formatFechaLarga(resena.creado_en)}</small>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_BADGE[resena.estado] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {ESTADO_ICONO[resena.estado]} {ESTADOS.find((e) => e.value === resena.estado)?.label.replace(/s$/, "")}
                    </span>
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <i className="fas fa-box text-blue-700 dark:text-blue-400" />
                  <span className="font-semibold">Producto:</span>
                  <Link href={`/productos/${resena.producto}`} target="_blank" className="text-blue-700 hover:underline dark:text-blue-400">
                    {truncatechars(resena.producto_nombre, 60)}
                  </Link>
                </div>

                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i
                      key={i}
                      className={i < resena.calificacion ? "fas fa-star text-amber-500" : "far fa-star text-gray-300 dark:text-slate-600"}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold dark:text-slate-100">{resena.calificacion}/5</span>
                </div>

                {resena.titulo && <h5 className="mb-2 font-bold text-gray-900 dark:text-slate-100">{resena.titulo}</h5>}

                <div className="mb-3 rounded-md border-l-4 border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                  {resena.comentario}
                </div>

                {resena.foto && (
                  <div className="mb-3">
                    <div className="relative h-30 w-30 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
                      <Image src={resena.foto} alt="Foto reseña" fill className="object-cover" unoptimized />
                    </div>
                  </div>
                )}

                {resena.estado === "rechazada" && resena.motivo_rechazo && (
                  <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    <i className="fas fa-ban mr-1" />
                    <strong>Motivo:</strong> {resena.motivo_rechazo}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 dark:border-slate-700">
                  <ResenaModeracion resenaId={resena.id} estado={resena.estado} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-16 text-center dark:bg-slate-800">
          <div className="mb-4 text-6xl">{ESTADO_ICONO[estado]}</div>
          <h4 className="font-bold text-gray-500 dark:text-slate-300">No hay reseñas {estado}s</h4>
          <p className="text-gray-500 dark:text-slate-400">{VACIO_SUBTITULO[estado]}</p>
        </div>
      )}

      <AdminPagination
        currentPage={data.current_page}
        numPages={data.num_pages}
        hasNext={data.has_next}
        hasPrevious={data.has_previous}
        basePath="/dashboard/resenas"
        searchParams={{ estado }}
      />
    </div>
  );
}
