import AdminPagination from "@/components/dashboard/AdminPagination";
import { adminApiGet } from "@/lib/api-admin";
import type { UsuariosListResponse } from "@/lib/dashboard-types";
import { formatFecha } from "@/lib/orderStatus";

export default async function UsuariosPage(props: PageProps<"/dashboard/usuarios">) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const data = await adminApiGet<UsuariosListResponse>(`/api/dashboard/usuarios/?${params.toString()}`);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Clientes <span className="text-base font-normal text-gray-500">({data.clientes.count})</span>
        </h1>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {data.clientes.results.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.ciudad || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatFecha(c.fecha_registro)}</td>
                </tr>
              ))}
              {data.clientes.results.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay clientes todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          currentPage={data.clientes.current_page}
          numPages={data.clientes.num_pages}
          hasNext={data.clientes.has_next}
          hasPrevious={data.clientes.has_previous}
          basePath="/dashboard/usuarios"
          searchParams={{}}
        />
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Administradores <span className="text-base font-normal text-gray-500">({data.total_admins})</span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {data.admins.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.email}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.tipo_usuario}</td>
                  <td className="px-4 py-3 text-gray-500">{formatFecha(a.fecha_registro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
