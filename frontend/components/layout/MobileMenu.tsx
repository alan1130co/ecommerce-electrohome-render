"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useWishlistStore } from "@/store/wishlistStore";

function iniciales(firstName: string, lastName: string, email: string) {
  if (firstName) return (firstName[0] + (lastName?.[0] ?? "")).toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

function MenuRow({
  href,
  icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-gray-800 last:border-b-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <i className={`fas ${icon}`} />
      </span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-5 pt-5 pb-2 text-[11px] font-bold tracking-wide text-gray-400 uppercase">{children}</p>;
}

// Menú lateral (off-canvas) móvil — abierto desde el botón "Menú" de
// MobileBottomNav. Reproduce el panel de producción: saludo, cuenta,
// navegación y preferencias.
export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, checked, fetchMe, logout } = useAuthStore();
  const wishlistTotal = useWishlistStore((s) => s.summary?.total_items ?? 0);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const { dark, toggle: toggleTheme } = useThemeStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const nombre = user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.email;
  const sigla = user ? iniciales(user.first_name, user.last_name, user.email) : "";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-80 flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="bg-linear-to-br from-blue-700 to-blue-900 px-5 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-amber-600 text-sm font-extrabold text-white shadow">
                    {sigla}
                  </div>
                  <div>
                    <p className="font-semibold">{nombre}</p>
                    <p className="mt-0.5 text-sm text-white/80">Cliente ElectroHome</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-semibold">¡Hola! 👋</p>
                  <p className="mt-0.5 text-sm text-white/80">Inicia sesión para más opciones</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            >
              ✕
            </button>
          </div>
        </div>

        <SectionLabel>{user ? "Mi Cuenta" : "Cuenta"}</SectionLabel>
        {checked && !user && (
          <div className="flex flex-col gap-2.5 px-5">
            <Link
              href="/cuenta/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)]"
            >
              <i className="fas fa-sign-in-alt" /> Iniciar Sesión
            </Link>
            <Link
              href="/cuenta/registro"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(245,158,11,0.4)]"
            >
              <i className="fas fa-user-plus" /> Registrarse gratis
            </Link>
          </div>
        )}
        <div className="mt-1">
          {user && <MenuRow href="/cuenta/perfil" icon="fa-user" label="Mi Perfil" onClick={onClose} />}
          {user && <MenuRow href="/pedidos" icon="fa-shopping-bag" label="Mis Pedidos" onClick={onClose} />}
          {user && (
            <MenuRow href="/wishlist" icon="fa-heart" label="Lista de Deseos" badge={wishlistTotal} onClick={onClose} />
          )}
          <MenuRow href="/carrito" icon="fa-shopping-cart" label={user ? "Mi Carrito" : "Ver Carrito"} onClick={onClose} />
        </div>

        <SectionLabel>Navegación</SectionLabel>
        <div>
          <MenuRow href="/" icon="fa-home" label="Inicio" onClick={onClose} />
          <MenuRow href="/productos" icon="fa-tag" label="Productos" onClick={onClose} />
          <MenuRow href="/contacto" icon="fa-envelope" label="Contacto" onClick={onClose} />
        </div>

        <SectionLabel>Preferencias</SectionLabel>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <i className={`fas ${dark ? "fa-moon" : "fa-sun"}`} />
            </span>
            Modo oscuro
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-pressed={dark}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${dark ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                dark ? "translate-x-5.5 left-0.5" : "left-0.5 translate-x-0"
              }`}
            />
          </button>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 border-t border-gray-100 px-5 py-3.5 text-left text-sm font-medium text-red-600"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <i className="fas fa-sign-out-alt" />
            </span>
            Cerrar Sesión
          </button>
        )}
      </div>
    </>
  );
}
