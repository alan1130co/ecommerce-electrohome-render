import Link from "next/link";

import CarritoView from "@/components/product/CarritoView";
import { userApiGet } from "@/lib/api-user";
import type { CartSummary, ProductoDetalle, ProductoResumen } from "@/lib/types";

export default async function CarritoPage() {
  const summary = await userApiGet<CartSummary>("/api/cart/");

  if (summary.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800">
          <i className="fas fa-shopping-cart" /> Carrito de Compras
        </h1>
        <div className="rounded-lg bg-white p-16 text-center shadow-md">
          <i className="fas fa-shopping-cart text-8xl text-gray-300" />
          <p className="mt-6 text-xl font-bold text-gray-800">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-gray-500">¡Agrega productos para empezar tu compra!</p>
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

  // Especificaciones/stock por ítem (CartItemSerializer usa el serializer
  // liviano) y recomendaciones "frecuentemente comprados juntos" por
  // producto — ambos en paralelo entre sí y contra el fetch de arriba ya
  // resuelto, en vez de la cascada mount→fetchCart→fetch detalles→fetch
  // recomendaciones que hacía esto en el cliente.
  const [detallesResueltos, recomendadosPorItem] = await Promise.all([
    Promise.all(
      summary.items.map((item) =>
        userApiGet<ProductoDetalle>(`/api/productos/${item.producto.id}/`).catch(() => null),
      ),
    ),
    Promise.all(
      summary.items.map((item) =>
        userApiGet<ProductoResumen[]>(`/api/productos/${item.producto.id}/frecuentes/?limit=4`).catch(
          () => [] as ProductoResumen[],
        ),
      ),
    ),
  ]);

  const detalles: Record<number, ProductoDetalle> = {};
  summary.items.forEach((item, i) => {
    const d = detallesResueltos[i];
    if (d) detalles[item.producto.id] = d;
  });

  const enCarrito = new Set(summary.items.map((i) => i.producto.id));
  const vistos = new Set(enCarrito);
  const recomendados: ProductoResumen[] = [];
  for (const lista of recomendadosPorItem) {
    for (const p of lista) {
      if (!vistos.has(p.id)) {
        vistos.add(p.id);
        recomendados.push(p);
      }
    }
  }

  return (
    <CarritoView
      initialSummary={summary}
      initialDetalles={detalles}
      initialRecomendados={recomendados.slice(0, 4)}
    />
  );
}
