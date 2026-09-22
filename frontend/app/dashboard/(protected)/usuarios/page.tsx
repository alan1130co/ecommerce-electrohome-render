import Link from "next/link";

import UsuariosTabs from "@/components/dashboard/UsuariosTabs";
import { adminApiGet } from "@/lib/api-admin";
import type { UsuariosListResponse } from "@/lib/dashboard-types";

export default async function UsuariosPage(props: PageProps<"/dashboard/usuarios">) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? sp.page : "";

  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const data = await adminApiGet<UsuariosListResponse>(`/api/dashboard/usuarios/?${params.toString()}`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <i className="fas fa-users text-amber-500" /> Usuarios
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Clientes y administradores registrados</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          ← Dashboard
        </Link>
      </div>

      <UsuariosTabs clientes={data.clientes} admins={data.admins} totalAdmins={data.total_admins} />
    </div>
  );
}
