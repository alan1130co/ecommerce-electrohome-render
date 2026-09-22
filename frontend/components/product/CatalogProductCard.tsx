"use client";

import Image from "next/image";
import Link from "next/link";

import WishlistButton from "@/components/product/WishlistButton";
import { useCartStore } from "@/store/cartStore";
import type { ProductoResumen } from "@/lib/types";

const formatPrecio = (precio: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));

interface PromoOverride {
  precioPromocional: string | null;
  etiqueta: string;
}

interface CatalogProductCardProps {
  producto: ProductoResumen;
  /**
   * Para tarjetas dentro de una SeccionPromocional: el descuento ahí es
   * específico de esa sección (ProductoSeccion.descuento_porcentaje /
   * precio_promocional), no el `promocion_activa` genérico del producto.
   */
  promoOverride?: PromoOverride;
  /** "grid" (tarjeta completa) o "carousel" (angosta, para tiras de scroll horizontal en Home). */
  variant?: "grid" | "carousel";
}

// Card de producto única para todo el sitio (Home, Catálogo, Búsqueda,
// Wishlist, Carrito, similares/frecuentes) — antes había 3 implementaciones
// distintas (ProductCard, esta y una tercera inline en WishlistGrid).
export default function CatalogProductCard({ producto, promoOverride, variant = "grid" }: CatalogProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isCarousel = variant === "carousel";

  const precioPromocional = promoOverride
    ? promoOverride.precioPromocional
    : (producto.promocion_activa?.precio_promocional ?? null);
  const descuentoPct = promoOverride
    ? promoOverride.etiqueta.replace(/[^0-9]/g, "")
    : producto.promocion_activa
      ? Math.round(Number(producto.promocion_activa.descuento_porcentaje))
      : null;

  const handleComprar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(producto.id);
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl dark:bg-slate-800 ${
        isCarousel ? "w-65 shrink-0" : "w-full"
      }`}
    >
      <WishlistButton productId={producto.id} variant="products" />
      <Link href={`/productos/${producto.id}`} className="block">
        {/* Fondo claro fijo (no --bg-elevated): las fotos de producto traen
            fondo blanco/transparente y se perderían sobre un contenedor
            oscuro. */}
        <div
          className={`relative flex w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-slate-200 ${
            isCarousel ? "h-45" : "h-56"
          }`}
        >
          {producto.imagen_principal ? (
            <Image
              src={producto.imagen_principal}
              alt={producto.nombre}
              fill
              sizes="300px"
              className="object-contain transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <i className="fas fa-image text-4xl text-gray-400" />
          )}
          {descuentoPct && (
            <span className="absolute top-2 right-2 z-10 rounded-full bg-linear-to-br from-red-500 to-red-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
              -{descuentoPct}%
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
          <i className="fas fa-tag" /> {producto.categoria_nombre}
        </p>
        <Link href={`/productos/${producto.id}`} className="mb-4 block">
          <h3 className="line-clamp-2 min-h-12 text-base font-bold text-gray-800 transition hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
            {producto.nombre}
          </h3>
        </Link>
        <div className="flex-1" />
        <div className="mb-4 mt-2 flex items-center justify-between">
          {precioPromocional ? (
            <div>
              <span className="mr-2 text-sm text-gray-400 line-through dark:text-slate-500">
                {formatPrecio(producto.precio)}
              </span>
              <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatPrecio(precioPromocional)}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatPrecio(producto.precio)}</span>
          )}
          {producto.disponible ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
              <i className="fas fa-check-circle" /> Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
              <i className="fas fa-times-circle" /> Agotado
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleComprar}
            disabled={!producto.disponible}
            className="flex flex-1 items-center justify-center rounded-lg bg-yellow-500 py-2.5 font-semibold text-white transition duration-200 hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
          >
            <i className={producto.disponible ? "fas fa-cart-plus text-lg" : "fas fa-times text-lg"} />
          </button>
          <Link
            href={`/productos/${producto.id}`}
            className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition duration-200 hover:bg-blue-700"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}
