"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

// Solo se muestra si hay sesión — igual que el header original, que
// oculta el corazón para visitantes anónimos.
export default function WishlistBadge() {
  const user = useAuthStore((s) => s.user);
  const totalItems = useWishlistStore((s) => s.summary?.total_items ?? 0);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  if (!user) return null;

  return (
    <span aria-label="Favoritos" className="relative inline-flex text-white transition hover:text-red-400">
      <i className="fas fa-heart header-icon-lg" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {totalItems}
        </span>
      )}
    </span>
  );
}
