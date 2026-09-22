"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import AuthStatus from "@/components/layout/AuthStatus";
import CartBadge from "@/components/layout/CartBadge";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileMenu from "@/components/layout/MobileMenu";
import SearchBar from "@/components/layout/SearchBar";
import ThemeToggleButton from "@/components/layout/ThemeToggleButton";
import WishlistBadge from "@/components/layout/WishlistBadge";

// Reemplaza el navbar que hoy está copiado en 13 templates de Django.
export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = (isActive: boolean) =>
    `nav-text rounded-lg px-4 py-2 transition ${
      isActive ? "font-bold text-yellow-400" : "text-gray-100"
    }`;

  // Login y registro usan un header minimalista en producción — sin
  // buscador ni links de navegación, solo el logo y un botón de volver.
  const isAuthPage = pathname?.startsWith("/cuenta/login") || pathname?.startsWith("/cuenta/registro");
  if (isAuthPage) {
    return (
      <header className="bg-blue-800 shadow-2xl border-b-4 border-blue-400 sticky top-0 z-50">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- ver nota abajo */}
            <img src="/img/logo_de_electrohome.png" alt="ElectroHome" className="logo-principal" />
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-100 transition hover:text-yellow-300">
            <i className="fas fa-home" /> Volver al inicio
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-blue-800 shadow-2xl border-b-4 border-blue-400 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Link href="/" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- Next Image
                optimizer sirve este PNG con Content-Disposition:attachment
                (fuerza descarga en vez de mostrarlo); <img> plano evita el problema
                y es lo que hacía el template original también. */}
            <img src="/img/logo_de_electrohome.png" alt="ElectroHome" className="logo-principal" />
          </Link>

          <SearchBar />

          <div className="hidden items-center space-x-1 lg:flex">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Inicio
            </Link>
            <Link href="/productos" className={navLinkClass(pathname?.startsWith("/productos") ?? false)}>
              Productos
            </Link>
            <Link href="/contacto" className={navLinkClass(pathname?.startsWith("/contacto") ?? false)}>
              Contacto
            </Link>
          </div>

          <div className="hidden shrink-0 items-center space-x-2 lg:flex">
            <ThemeToggleButton />
            <Link href="/wishlist">
              <WishlistBadge />
            </Link>
            <Link href="/carrito" className="relative text-white transition hover:text-yellow-300">
              <CartBadge />
            </Link>
            <AuthStatus />
          </div>
        </div>
      </nav>
      <MobileBottomNav onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
