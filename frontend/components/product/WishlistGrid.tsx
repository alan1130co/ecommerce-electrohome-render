"use client";

import Link from "next/link";
import { useState } from "react";

import CatalogProductCard from "@/components/product/CatalogProductCard";
import type { WishlistSummary } from "@/lib/types";
import { useWishlistStore } from "@/store/wishlistStore";

// Recibe el summary ya cargado por el Server Component padre
// (wishlist/page.tsx) e hidrata el store global con él — así el badge
// del header y el resto de componentes que leen useWishlistStore quedan
// sincronizados sin tener que volver a pedir los datos por su cuenta.
//
// Se sobreescribe el store SIEMPRE (no solo si estaba vacío): addItem/
// removeItem actualizan `total_items` e `ids` de forma optimista pero no
// tocan el array `items` completo, así que un summary ya en el store puede
// tener el contador correcto y `items` desactualizado (ej. faltando un
// producto agregado desde otra página). Esta página siempre trae el dato
// fresco del servidor, así que debe ganarle a cualquier estado previo.
export default function WishlistGrid({ initialSummary }: { initialSummary: WishlistSummary }) {
  useState(() => {
    useWishlistStore.setState({
      summary: initialSummary,
      ids: new Set(initialSummary.items.map((i) => i.producto.id)),
    });
    return null;
  });

  const { summary, clearAll } = useWishlistStore();
  const [clearing, setClearing] = useState(false);

  const data = summary ?? initialSummary;

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAll();
    } finally {
      setClearing(false);
    }
  };

  if (data.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-slate-400">Tu lista de deseos está vacía.</p>
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
            <span className="text-red-600 dark:text-red-400">❤</span> Lista de Deseos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{data.total_items} productos guardados</p>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={clearing}
          className="flex items-center gap-2 rounded-lg bg-linear-to-br from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition hover:from-red-600 hover:to-red-700 disabled:opacity-50"
        >
          <i className="fas fa-trash" /> Vaciar Lista
        </button>
      </div>

      {/* Misma card que Home/Catálogo/Búsqueda: al estar ya en la wishlist,
          el corazón de CatalogProductCard aparece activo y quitarla de la
          lista es cuestión de volver a tocarlo (mismo toggle de siempre),
          sin necesitar un botón "eliminar" aparte. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <CatalogProductCard key={item.id} producto={item.producto} />
        ))}
      </div>
    </main>
  );
}
