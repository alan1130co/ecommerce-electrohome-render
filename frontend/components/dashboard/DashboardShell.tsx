import Link from "next/link";
import type { ReactNode } from "react";

import LogoutButton from "@/components/dashboard/LogoutButton";
import type { AdminMe } from "@/lib/dashboard-types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
  { href: "/dashboard/productos", label: "Productos" },
  { href: "/dashboard/categorias", label: "Categorías" },
  { href: "/dashboard/promociones", label: "Promociones" },
  { href: "/dashboard/secciones", label: "Secciones y banners" },
  { href: "/dashboard/resenas", label: "Reseñas" },
  { href: "/dashboard/usuarios", label: "Usuarios" },
  { href: "/dashboard/envio-masivo", label: "Envío masivo" },
] as const;

export default function DashboardShell({ user, children }: { user: AdminMe; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 text-slate-100 md:flex">
        <div className="px-5 py-5 text-lg font-bold tracking-tight">
          ElectroHome <span className="text-amber-400">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-400">
          {user.email}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-blue-800 px-4 py-3 text-white md:hidden">
          <span className="font-bold">ElectroHome Admin</span>
        </header>
        <header className="hidden items-center justify-end gap-4 bg-blue-800 px-6 py-3 text-white md:flex">
          <span className="text-sm">
            {user.first_name || user.email} · {user.tipo_usuario}
          </span>
          <LogoutButton />
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
