import AdminPagination from "@/components/dashboard/AdminPagination";
import ResenaModeracion from "@/components/dashboard/ResenaModeracion";
import { adminApiGet } from "@/lib/api-admin";
import type { AdminPage, ResenaAdmin } from "@/lib/dashboard-types";
import { formatFecha } from "@/lib/orderStatus";

const ESTADOS = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
] as const;

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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reseñas</h1>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {ESTADOS.map((e) => (
          <a
            key={e.value}
            href={`/dashboard/resenas?estado=${e.value}`}
            className={`rounded-full border px-3 py-1 ${
              estado === e.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 text-gray-600 hover:border-blue-400"
            }`}
          >
            {e.label} ({data.conteos[e.value]})
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {data.results.map((resena) => (
          <div key={resena.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-amber-400">{"★".repeat(resena.calificacion)}</span>
                <span className="text-xs text-gray-400">{"★".repeat(5 - resena.calificacion)}</span>
                <span className="text-sm font-semibold text-gray-800">{resena.producto_nombre}</span>
              </div>
              {resena.titulo && <p className="font-medium text-gray-800">{resena.titulo}</p>}
              <p className="text-sm text-gray-600">{resena.comentario}</p>
              <p className="mt-1 text-xs text-gray-400">
                {resena.usuario_nombre} · {resena.usuario_email} · {formatFecha(resena.creado_en)}
              </p>
              {resena.motivo_rechazo && (
                <p className="mt-1 text-xs text-red-500">Motivo de rechazo: {resena.motivo_rechazo}</p>
              )}
            </div>
            <ResenaModeracion resenaId={resena.id} estado={resena.estado} />
          </div>
        ))}
        {data.results.length === 0 && (
          <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400">
            No hay reseñas en este estado.
          </p>
        )}
      </div>

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
