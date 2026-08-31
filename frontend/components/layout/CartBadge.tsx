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

  return <span aria-label="Carrito">🛒 {totalItems}</span>;
}
