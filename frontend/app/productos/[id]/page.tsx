import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import CatalogProductCard from "@/components/product/CatalogProductCard";
import ProductoAcciones from "@/components/product/ProductoAcciones";
import ProductoTabs from "@/components/product/ProductoTabs";
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

  const specs: { label: string; value: string }[] = [];
  if (producto.capacidad) specs.push({ label: "Capacidad", value: producto.capacidad });
  if (producto.potencia) specs.push({ label: "Potencia", value: producto.potencia });
  if (producto.color) specs.push({ label: "Color", value: producto.color });
  if (producto.garantia_meses != null) {
    specs.push({ label: "Garantía", value: `${producto.garantia_meses} meses` });
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-700 hover:underline dark:hover:text-blue-400">
          Inicio
        </Link>
        <i className="fas fa-chevron-right text-xs text-gray-400 dark:text-slate-600" />
        <Link
          href={`/productos/?categoria=${producto.categoria.id}`}
          className="hover:text-blue-700 hover:underline dark:hover:text-blue-400"
        >
          {producto.categoria.nombre}
        </Link>
        <i className="fas fa-chevron-right text-xs text-gray-400 dark:text-slate-600" />
        <span className="text-gray-700 dark:text-slate-300">{producto.nombre}</span>
      </nav>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            {/* bg-white fijo (no dark:bg-slate-*): el producto casi siempre
                trae foto con fondo blanco/transparente. */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-600">
              {imagenes[0] ? (
                <Image
                  src={imagenes[0].imagen}
                  alt={producto.nombre}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
              <WishlistButton productId={producto.id} variant="detail" />
            </div>

            {imagenes.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {imagenes.slice(1).map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-white p-2 dark:border-slate-600"
                  >
                    <Image
                      src={img.imagen}
                      alt={img.descripcion || producto.nombre}
                      fill
                      sizes="120px"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300">{producto.nombre}</h1>
            {producto.marca && (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Marca: {producto.marca}</p>
            )}
            <p className="mt-1 text-sm italic text-gray-500 dark:text-slate-400">
              {resenas.length > 0
                ? `${resenas.length} reseña${resenas.length === 1 ? "" : "s"}`
                : "Sin reseñas aún"}
            </p>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {formatPrecio(promo?.precio_promocional ?? producto.precio)}
              </span>
              {promo?.precio_promocional && (
                <span className="text-lg text-gray-400 line-through dark:text-slate-500">
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
              className={`mt-2 flex items-center gap-2 text-sm font-semibold ${
                producto.disponible ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
              }`}
            >
              <i className={producto.disponible ? "fas fa-check-circle" : "fas fa-times-circle"} />
              {producto.disponible ? `Disponible (${producto.stock} unidades)` : "Agotado"}
            </p>

            <ProductoAcciones
              productId={producto.id}
              stock={producto.stock}
              disponible={producto.disponible}
            />

            <ul className="mt-5 space-y-2 text-sm text-gray-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <i className="fas fa-truck text-blue-700 dark:text-blue-400" /> Envío gratis en compras superiores a
                $150.000
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-undo text-blue-700 dark:text-blue-400" /> Devolución gratis en los primeros 30
                días
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-shield-alt text-blue-700 dark:text-blue-400" /> Garantía de 12 meses
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
        <ProductoTabs
          productId={producto.id}
          descripcion={producto.descripcion}
          specs={specs}
          caracteristicas={producto.caracteristicas_lista}
          resenas={resenas}
        />
      </div>

      <RelatedSection titulo="Productos similares" productos={similares} />
      <RelatedSection titulo="También podría interesarte" productos={frecuentes} />
    </main>
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
      <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-slate-200">{titulo}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {productos.map((producto) => (
          <CatalogProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </section>
  );
}
