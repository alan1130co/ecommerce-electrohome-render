"use client";

import { useEffect, useState } from "react";

import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistButton({ productId }: { productId: number }) {
  const { summary, fetchWishlist, addItem, removeItem, isInWishlist } = useWishlistStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Hay un WishlistButton por cada ProductCard — todos montan en el
    // mismo batch de render, así que `loading` desestructurado arriba
    // queda con el valor de ANTES de que el primero dispare el fetch
    // (closure obsoleta). Leer el estado en vivo con getState() evita
    // que los 20+ botones de una página disparen su propio fetch.
    const { summary: liveSummary, loading: liveLoading } = useWishlistStore.getState();
    if (!liveSummary && !liveLoading) fetchWishlist();
  }, [summary, fetchWishlist]);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      if (inWishlist) {
        await removeItem(productId);
      } else {
        await addItem(productId);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={inWishlist ? "Quitar de favoritos" : "Agregar a favoritos"}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow disabled:opacity-50"
    >
      {inWishlist ? "❤️" : "🤍"}
    </button>
  );
}
