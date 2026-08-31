import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/product/AddToCartButton";
import ProductCard from "@/components/product/ProductCard";
import ResenaForm from "@/components/product/ResenaForm";
import WishlistButton from "@/components/product/WishlistButton";
import { apiGet, apiGetOptional } from "@/lib/api";
import type { ProductoDetalle, ProductoResumen, Resena } from "@/lib/types";

const formatPrecio = (precio: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));

async function getProducto(id: string) {
  return apiGetOptional<ProductoDetalle>(`/api/productos/${id}/`);
}

export async function generateMetadata(
  props: PageProps<"/productos/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const producto = await getProducto(id);

  if (!producto) {
    return { title: "Producto no encontrado - ElectroHome" };
  }

  return {
    title: `${producto.nombre} - ElectroHome`,
    description: (producto.descripcion || producto.nombre).slice(0, 160),
    openGraph: producto.imagen_principal
      ? { images: [producto.imagen_principal] }
      : undefined,
  };
}

export default async function ProductoDetailPage(props: PageProps<"/productos/[id]">) {
  const { id } = await props.params;
  const producto = await getProducto(id);

  if (!producto) notFound();

  const [similares, frecuentes, resenas] = await Promise.all([
    apiGet<ProductoResumen[]>(`/api/productos/${id}/similares/?limit=4`),
    apiGet<ProductoResumen[]>(`/api/productos/${id}/frecuentes/?limit=4`),
    apiGet<Resena[]>(`/api/productos/${id}/resenas/`),
  ]);

  const promo = producto.promocion_activa;
  const imagenes = [
    ...(producto.imagen_principal
      ? [{ id: 0, imagen: producto.imagen_principal, descripcion: producto.nombre }]
      : []),
    ...producto.galeria,
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">{producto.categoria.nombre}</nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {imagenes[0] ? (
              <Image
                src={imagenes[0].imagen}
                alt={producto.nombre}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
            <WishlistButton productId={producto.id} />
          </div>

          {imagenes.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {imagenes.slice(1).map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-gray-100"
                >
                  <Image
                    src={img.imagen}
                    alt={img.descripcion || producto.nombre}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>
          {producto.marca && (
            <p className="mt-1 text-sm text-gray-500">Marca: {producto.marca}</p>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-blue-700">
              {formatPrecio(promo?.precio_promocional ?? producto.precio)}
            </span>
            {promo?.precio_promocional && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrecio(producto.precio)}
              </span>
            )}
            {promo && (
              <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                {promo.etiqueta}
              </span>
            )}
          </div>

          <p
            className={`mt-2 text-sm font-semibold ${
              producto.disponible ? "text-green-600" : "text-red-500"
            }`}
          >
            {producto.disponible ? `Disponible (${producto.stock} unidades)` : "Agotado"}
          </p>

          <AddToCartButton productId={producto.id} disabled={!producto.disponible} />

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {producto.capacidad && <Spec label="Capacidad" value={producto.capacidad} />}
            {producto.potencia && <Spec label="Potencia" value={producto.potencia} />}
            {producto.color && <Spec label="Color" value={producto.color} />}
            {producto.garantia_meses != null && (
              <Spec label="Garantía" value={`${producto.garantia_meses} meses`} />
            )}
          </dl>

          {producto.caracteristicas_lista.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Características
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                {producto.caracteristicas_lista.map((caracteristica, i) => (
                  <li key={i}>{caracteristica}</li>
                ))}
              </ul>
            </div>
          )}

          {producto.descripcion && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Descripción
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                {producto.descripcion}
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Reseñas {resenas.length > 0 && `(${resenas.length})`}
        </h2>

        <div className="mb-4">
          <ResenaForm productId={producto.id} />
        </div>

        {resenas.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay reseñas para este producto.</p>
        ) : (
          <div className="space-y-3">
            {resenas.map((resena) => (
              <div key={resena.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{resena.usuario_nombre}</p>
                  <span className="text-amber-400">{"★".repeat(resena.calificacion)}</span>
                </div>
                {resena.titulo && <p className="mt-1 font-medium text-gray-700">{resena.titulo}</p>}
                <p className="mt-1 text-sm text-gray-600">{resena.comentario}</p>
                {resena.foto && (
                  <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={resena.foto}
                      alt={`Foto de la reseña de ${resena.usuario_nombre}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <RelatedSection titulo="Productos similares" productos={similares} />
      <RelatedSection titulo="También podría interesarte" productos={frecuentes} />
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function RelatedSection({
  titulo,
  productos,
}: {
  titulo: string;
  productos: ProductoResumen[];
}) {
  if (productos.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold text-gray-800">{titulo}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {productos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </section>
  );
}
