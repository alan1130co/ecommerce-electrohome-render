"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import LogoutButton from "@/components/dashboard/LogoutButton";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import ThemeToggleButton from "@/components/layout/ThemeToggleButton";
import type { AdminMe } from "@/lib/dashboard-types";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [{ href: "/dashboard", label: "Inicio", icon: "fa-home" }],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/dashboard/productos", label: "Productos", icon: "fa-box" },
      { href: "/dashboard/categorias", label: "Categorías", icon: "fa-list" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/dashboard/pedidos", label: "Pedidos", icon: "fa-shopping-cart" },
      { href: "/dashboard/usuarios", label: "Usuarios", icon: "fa-users" },
      { href: "/dashboard/resenas", label: "Reseñas", icon: "fa-star" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/dashboard/promociones", label: "Promociones", icon: "fa-tag" },
      { href: "/dashboard/secciones", label: "Secciones del Home", icon: "fa-layer-group" },
      { href: "/dashboard/envio-masivo", label: "Envío Masivo", icon: "fa-envelope" },
    ],
  },
] as const;

function iniciales(user: AdminMe) {
  if (user.first_name) return user.first_name[0].toUpperCase();
  return user.email?.[0]?.toUpperCase() ?? "?";
}

export default function DashboardShell({ user, children }: { user: AdminMe; children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href));

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-slate-950">
      <header className="flex h-16 items-center gap-4 border-b-2 border-amber-500 bg-linear-to-b from-slate-900 to-blue-900 px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- ver nota en Navbar.tsx */}
          <img src="/img/logo_de_electrohome.png" alt="ElectroHome" className="h-14.5 w-auto object-contain" />
          <span className="text-xl font-extrabold text-white">ADMINISTRADOR</span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-4">
          <ThemeToggleButton />
          <NotificationsBell />
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pr-3.5 pl-1.5 text-sm text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-amber-600 text-xs font-extrabold text-slate-900">
              {iniciales(user)}
            </div>
            {user.first_name || user.email}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-65 shrink-0 flex-col bg-linear-to-b from-slate-900 to-slate-800 md:flex">
          <nav className="flex-1 px-3 pb-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="mt-2 px-3 pt-3 pb-1.5 text-[11px] font-bold tracking-wider text-white/30 uppercase">
                  {section.label}
                </div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm ${
                      isActive(item.href)
                        ? "bg-linear-to-br from-blue-700 to-blue-900 font-semibold text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <i className={`fas ${item.icon}`} /> {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-white/[0.07] px-1 py-1">
            <LogoutButton className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-red-400 hover:text-red-300" />
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
