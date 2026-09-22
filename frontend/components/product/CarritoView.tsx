"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CatalogProductCard from "@/components/product/CatalogProductCard";
import type { CartSummary, ProductoDetalle, ProductoResumen } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";

const formatPrecio = (precio: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));

const ENCABEZADO_ESPECIFICACIONES = /especificaciones principales/i;

function especificacionesPrincipales(p: ProductoDetalle): string | null {
  // Algunos productos importados traen la ficha técnica como texto
  // libre dentro de descripcion (ej. "Especificaciones principales
  // \r\n•Tipo : X\r\n•Modelo : Y..."). Cuando existe, es la fuente más
  // fiel — se usa tal cual en vez de los campos estructurados.
  if (p.descripcion && ENCABEZADO_ESPECIFICACIONES.test(p.descripcion)) {
    const items = p.descripcion
      .replace(ENCABEZADO_ESPECIFICACIONES, "")
      .split("•")
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (items.length > 0) return items.map((i) => `•${i}`).join(" ");
  }

  const partes: string[] = [];
  if (p.capacidad) partes.push(`Capacidad : ${p.capacidad}`);
  if (p.potencia) partes.push(`Potencia : ${p.potencia}`);
  if (p.color) partes.push(`Color : ${p.color}`);
  if (p.garantia_meses != null) partes.push(`Garantía : ${p.garantia_meses} meses`);
  if (partes.length === 0) return null;
  return partes.map((s) => `•${s}`).join(" ");
}

// Recibe carrito + detalles + recomendaciones ya resueltos en paralelo por
// el Server Component padre (carrito/page.tsx) — hidrata cartStore con el
// summary inicial (mismo patrón que WishlistGrid) y solo maneja acá el
// estado interactivo de cantidad/eliminar/vaciar.
export default function CarritoView({
  initialSummary,
  initialDetalles,
  initialRecomendados,
}: {
  initialSummary: CartSummary;
  initialDetalles: Record<number, ProductoDetalle>;
  initialRecomendados: ProductoResumen[];
}) {
  useState(() => {
    if (!useCartStore.getState().summary) {
      useCartStore.setState({ summary: initialSummary });
    }
    return null;
  });

  const { summary, error, updateItem, removeItem, clearCart } = useCartStore();
  const data = summary ?? initialSummary;
  const detalles = initialDetalles;
  const recomendados = initialRecomendados;

  if (!data || data.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800 dark:text-blue-300">
          <i className="fas fa-shopping-cart" /> Carrito de Compras
        </h1>

        <div className="rounded-lg bg-white p-16 text-center shadow-md dark:bg-slate-800">
          <i className="fas fa-shopping-cart text-8xl text-gray-300 dark:text-slate-600" />
          <p className="mt-6 text-xl font-bold text-gray-800 dark:text-slate-100">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">¡Agrega productos para empezar tu compra!</p>
          <Link
            href="/productos"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            <i className="fas fa-shopping-bag" /> Ir a Comprar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800 dark:text-blue-300">
        <i className="fas fa-shopping-cart" /> Carrito de Compras
      </h1>

      {error && <p className="mb-4 text-sm font-medium text-red-500 dark:text-red-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {data.items.map((item) => {
            const detalle = detalles[item.producto.id];
            const specs = detalle ? especificacionesPrincipales(detalle) : null;

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-slate-200">
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

                <div className="min-w-40 flex-1">
                  <Link
                    href={`/productos/${item.producto.id}`}
                    className="font-bold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {item.producto.nombre}
                  </Link>
                  {specs && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                      <span className="font-medium">Especificaciones principales</span> {specs}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Stock disponible: {item.producto.stock}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, item.quantity - 1)}
                    className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="w-6 text-center dark:text-slate-100">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                    className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-blue-700 dark:text-blue-400">{formatPrecio(item.subtotal)}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{formatPrecio(item.producto.precio)} c/u</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-1 flex items-center gap-1 text-sm text-red-500 hover:underline dark:text-red-400"
                  >
                    <i className="fas fa-trash-alt" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => clearCart()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 hover:underline dark:text-slate-400 dark:hover:text-red-400"
            >
              <i className="fas fa-trash-alt" /> Vaciar Carrito
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md lg:col-span-1 lg:self-start dark:bg-slate-800">
          <h2 className="mb-4 text-xl font-bold text-blue-800 dark:text-blue-300">Resumen del Pedido</h2>

          <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrecio(data.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span>{formatPrecio(data.tax)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-gray-200 dark:border-slate-700" />

          <div className="flex justify-between text-lg font-bold text-blue-700 dark:text-blue-400">
            <span>Total:</span>
            <span>{formatPrecio(data.total)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 flex items-center justify-center gap-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            <i className="fas fa-credit-card" /> Proceder al Pago
          </Link>
          <Link
            href="/productos"
            className="mt-3 flex items-center justify-center gap-2 rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            <i className="fas fa-arrow-left" /> Seguir Comprando
          </Link>
        </div>
      </div>

      {recomendados.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-slate-200">Recomendaciones te puede interesar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recomendados.map((producto) => (
              <CatalogProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
