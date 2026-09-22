"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cartStore";

// Único pedazo interactivo del Navbar — el resto se queda como Server
// Component. Evita convertir todo el layout en cliente solo por esto.
export default function CartBadge() {
  const totalItems = useCartStore((s) => s.summary?.total_items ?? 0);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <span aria-label="Carrito" className="relative inline-flex">
      <i className="fas fa-shopping-cart header-icon-lg" />
      <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
        {totalItems}
      </span>
    </span>
  );
}
