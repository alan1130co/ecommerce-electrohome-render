"use client";

import { useEffect, useState } from "react";

import { useToastStore } from "@/store/toastStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistButton({
  productId,
  variant,
}: {
  productId: number;
  /** "products" (grilla de tarjetas de producto) o "detail" (imagen principal de detalle de producto). */
  variant: "products" | "detail";
}) {
  const { summary, fetchWishlist, addItem, removeItem, isInWishlist } = useWishlistStore();
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Hay un WishlistButton por cada CatalogProductCard — todos montan en el
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
    const wasInWishlist = inWishlist;
    // El store actualiza corazón/contador de forma optimista (antes de
    // esperar la red), así que el toast también dispara al instante en
    // vez de esperar a que resuelva la petición.
    if (!wasInWishlist) showToast("Se ha agregado a tu lista de deseos");
    setBusy(true);
    try {
      if (wasInWishlist) {
        await removeItem(productId);
      } else {
        await addItem(productId);
      }
    } catch {
      // El store ya revirtió el estado optimista si la petición falló.
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
      className={`${
        variant === "products" ? "wishlist-btn-products" : "wishlist-btn-detail"
      } disabled:opacity-50 ${inWishlist ? "active" : ""}`}
    >
      {inWishlist ? "❤" : "♡"}
    </button>
  );
}
