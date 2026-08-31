import Link from "next/link";

import AuthStatus from "@/components/layout/AuthStatus";
import CartBadge from "@/components/layout/CartBadge";
import SearchBar from "@/components/layout/SearchBar";

// Reemplaza el navbar que hoy está copiado en 13 templates de Django.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-blue-700 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ElectroHome
        </Link>

        <SearchBar />

        <nav className="hidden gap-6 text-sm font-semibold md:flex">
          <Link href="/" className="hover:text-amber-300">
            Inicio
          </Link>
          <Link href="/productos" className="hover:text-amber-300">
            Productos
          </Link>
          <Link href="/pedidos" className="hover:text-amber-300">
            Mis pedidos
          </Link>
          <Link href="/wishlist" className="hover:text-amber-300">
            Favoritos
          </Link>
          <Link href="/contacto" className="hover:text-amber-300">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/carrito" className="hover:text-amber-300">
            <CartBadge />
          </Link>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
