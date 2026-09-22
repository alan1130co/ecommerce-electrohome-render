"use client";

import { useState } from "react";

import AdminPagination from "@/components/dashboard/AdminPagination";
import type { AdminPage, UsuarioAdmin } from "@/lib/dashboard-types";
import { formatFecha, formatFechaCorta } from "@/lib/orderStatus";

const tabClass = (active: boolean) =>
  `rounded-t-lg px-6 py-2.5 text-sm font-bold ${
    active
      ? "bg-linear-to-br from-blue-700 to-blue-900 text-white"
      : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
  }`;

const EstadoBadge = ({ activo }: { activo: boolean }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
      activo
        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
        : "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300"
    }`}
  >
    {activo ? "Activo" : "Inactivo"}
  </span>
);

export default function UsuariosTabs({
  clientes,
  admins,
  totalAdmins,
}: {
  clientes: AdminPage<UsuarioAdmin>;
  admins: UsuarioAdmin[];
  totalAdmins: number;
}) {
  const [tab, setTab] = useState<"clientes" | "admins">("clientes");

  return (
    <>
      <div className="mb-0 flex gap-1">
        <button type="button" onClick={() => setTab("clientes")} className={tabClass(tab === "clientes")}>
          👥 Clientes ({clientes.count})
        </button>
        <button type="button" onClick={() => setTab("admins")} className={tabClass(tab === "admins")}>
          🔐 Administradores ({totalAdmins})
        </button>
      </div>

      {tab === "clientes" ? (
        <>
          <div className="overflow-x-auto rounded-b-lg rounded-tr-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Órdenes</th>
                  <th className="px-4 py-3">Miembro Desde</th>
                </tr>
              </thead>
              <tbody>
                {clientes.results.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-slate-700">
                    <td className="px-4 py-3">
                      <a href={`mailto:${c.email}`} className="font-medium text-blue-700 dark:text-blue-400">
                        {c.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-slate-200">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3">
                      {c.telefono ? (
                        <a href={`tel:${c.telefono}`} className="text-slate-500 underline dark:text-slate-400">
                          {c.telefono}
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.ciudad || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={c.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-700/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {c.total_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFechaCorta(c.fecha_registro)}</td>
                  </tr>
                ))}
                {clientes.results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                      No hay clientes todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            currentPage={clientes.current_page}
            numPages={clientes.num_pages}
            hasNext={clientes.has_next}
            hasPrevious={clientes.has_previous}
            basePath="/dashboard/usuarios"
            searchParams={{}}
          />
        </>
      ) : (
        <div className="overflow-x-auto rounded-b-lg rounded-tr-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Último Acceso</th>
                <th className="px-4 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-4 py-3">
                    <a href={`mailto:${a.email}`} className="font-medium text-blue-700 dark:text-blue-400">
                      {a.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-slate-200">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="px-4 py-3">
                    {a.is_superuser ? (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                        SuperAdmin
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={a.is_active} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                    {a.last_login ? formatFecha(a.last_login) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{formatFechaCorta(a.fecha_registro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
