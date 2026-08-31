"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { useCartStore } from "@/store/cartStore";

const formatPrecio = (precio: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));

export default function CarritoPage() {
  const { summary, loading, error, fetchCart, updateItem, removeItem, clearCart } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading && !summary) {
    return (
      <main className="mx-auto max-w-4xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando carrito...
      </main>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl flex-1 px-4 py-16 text-center">
        <p className="text-lg text-gray-500">Tu carrito está vacío.</p>
        <Link
          href="/productos"
          className="mt-4 inline-block rounded bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tu carrito</h1>

      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

      <div className="space-y-4">
        {summary.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
              {item.producto.imagen_principal && (
                <Image
                  src={item.producto.imagen_principal}
                  alt={item.producto.nombre}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="min-w-[10rem] flex-1">
              <Link
                href={`/productos/${item.producto.id}`}
                className="font-medium text-gray-800 hover:text-blue-700"
              >
                {item.producto.nombre}
              </Link>
              <p className="text-sm text-gray-500">{formatPrecio(item.producto.precio)} c/u</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateItem(item.id, item.quantity - 1)}
                className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateItem(item.id, item.quantity + 1)}
                className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right font-semibold text-blue-700">
              {formatPrecio(item.subtotal)}
            </p>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-500 hover:underline"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-end gap-1 text-sm text-gray-700">
        <p>
          Subtotal: <span className="font-semibold">{formatPrecio(summary.subtotal)}</span>
        </p>
        <p>
          IVA (19%): <span className="font-semibold">{formatPrecio(summary.tax)}</span>
        </p>
        <p className="text-lg">
          Total:{" "}
          <span className="font-bold text-blue-700">{formatPrecio(summary.total)}</span>
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => clearCart()}
          className="text-sm text-gray-500 hover:underline"
        >
          Vaciar carrito
        </button>
        <Link
          href="/checkout"
          className="rounded bg-amber-500 px-6 py-2 font-semibold text-white hover:bg-amber-600"
        >
          Ir a pagar
        </Link>
      </div>
    </main>
  );
}
