"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

// Barra de navegación fija inferior — patrón mobile de producción,
// reemplaza los íconos del header (que en mobile pasan al menú lateral).
export default function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const wishlistTotal = useWishlistStore((s) => s.summary?.total_items ?? 0);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  const itemClass = (isActive: boolean) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${
      isActive ? "text-blue-700" : "text-gray-400"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-end border-t border-gray-200 bg-white px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden"
      aria-label="Navegación móvil"
    >
      <Link href="/" className={itemClass(pathname === "/")}>
        <i className="fas fa-home text-lg" />
        Inicio
      </Link>
      <Link href="/wishlist" className={`relative ${itemClass(pathname === "/wishlist")}`}>
        <span className="relative">
          <i className="fas fa-heart text-lg" />
          {wishlistTotal > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {wishlistTotal}
            </span>
          )}
        </span>
        Favoritos
      </Link>
      <Link href="/carrito" className="flex flex-1 flex-col items-center gap-1 text-[11px] font-medium text-gray-400">
        <span className="-mt-6 flex h-13 w-13 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-[0_6px_16px_rgba(37,99,235,0.45)]">
          <i className="fas fa-shopping-cart text-lg" />
        </span>
        Carrito
      </Link>
      <Link href="/productos" className={itemClass(pathname === "/productos")}>
        <i className="fas fa-tag text-lg" />
        Productos
      </Link>
      <button type="button" onClick={onOpenMenu} className={itemClass(false)}>
        <i className="fas fa-bars text-lg" />
        Menú
      </button>
    </nav>
  );
}
