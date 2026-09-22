"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCartStore } from "@/store/cartStore";

export default function ProductoAcciones({
  productId,
  stock,
  disponible,
}: {
  productId: number;
  stock: number;
  disponible: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [cantidad, setCantidad] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [comprando, setComprando] = useState(false);

  const disabled = !disponible || stock < 1;

  const handleAgregar = async () => {
    setStatus("loading");
    try {
      await addItem(productId, cantidad);
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  };

  const handleComprarAhora = async () => {
    setComprando(true);
    try {
      await addItem(productId, cantidad);
      router.push("/checkout");
    } catch {
      setComprando(false);
    }
  };

  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">Cantidad:</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          disabled={disabled || cantidad <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-semibold text-gray-800 dark:text-slate-100">{cantidad}</span>
        <button
          type="button"
          onClick={() => setCantidad((c) => Math.min(stock, c + 1))}
          disabled={disabled || cantidad >= stock}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAgregar}
        disabled={disabled || status === "loading"}
        className="mt-4 w-full rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" && "Agregando..."}
        {status === "ok" && "¡Agregado! 🛒"}
        {status === "error" && "Error — intenta de nuevo"}
        {status === "idle" && (disabled ? "Agotado" : "Agregar al Carrito")}
      </button>

      <button
        type="button"
        onClick={handleComprarAhora}
        disabled={disabled || comprando}
        className="mt-3 w-full rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {comprando ? "Procesando..." : "Comprar Ahora"}
      </button>
    </div>
  );
}
