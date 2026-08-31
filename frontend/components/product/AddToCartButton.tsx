"use client";

import { useState } from "react";

import { useCartStore } from "@/store/cartStore";

export default function AddToCartButton({
  productId,
  disabled,
}: {
  productId: number;
  disabled?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const handleClick = async () => {
    setStatus("loading");
    try {
      await addItem(productId, 1);
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      className="mt-6 w-full rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {status === "loading" && "Agregando..."}
      {status === "ok" && "¡Agregado! 🛒"}
      {status === "error" && "Error — intenta de nuevo"}
      {status === "idle" && (disabled ? "Agotado" : "Agregar al carrito")}
    </button>
  );
}
