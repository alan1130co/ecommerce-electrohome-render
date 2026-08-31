import Image from "next/image";
import Link from "next/link";

import WishlistButton from "@/components/product/WishlistButton";
import Badge from "@/components/ui/Badge";
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

interface ProductCardProps {
  producto: ProductoResumen;
  /**
   * Para tarjetas dentro de una SeccionPromocional: el descuento ahí es
   * específico de esa sección (ProductoSeccion.descuento_porcentaje /
   * precio_promocional), no el `promocion_activa` genérico del producto.
   */
  promoOverride?: PromoOverride;
}

// Reemplaza la tarjeta de producto repetida en home.html / products_list.html.
export default function ProductCard({ producto, promoOverride }: ProductCardProps) {
  const precioPromocional = promoOverride
    ? promoOverride.precioPromocional
    : producto.promocion_activa?.precio_promocional ?? null;
  const etiquetaPromo = promoOverride
    ? promoOverride.etiqueta
    : producto.promocion_activa?.etiqueta;

  return (
    <Link
      href={`/productos/${producto.id}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
        {producto.imagen_principal ? (
          <Image
            src={producto.imagen_principal}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sin imagen
          </div>
        )}
        {etiquetaPromo && <Badge>{etiquetaPromo}</Badge>}
        <WishlistButton productId={producto.id} />
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800">
        {producto.nombre}
      </h3>
      <p className="mt-0.5 text-xs text-gray-500">{producto.categoria_nombre}</p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-base font-bold text-blue-700">
          {formatPrecio(precioPromocional ?? producto.precio)}
        </span>
        {precioPromocional && (
          <span className="text-xs text-gray-400 line-through">
            {formatPrecio(producto.precio)}
          </span>
        )}
      </div>

      {!producto.disponible && (
        <p className="mt-1 text-xs font-semibold text-red-500">Agotado</p>
      )}
    </Link>
  );
}
