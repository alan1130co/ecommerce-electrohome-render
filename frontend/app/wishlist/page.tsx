"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { formatPrecio } from "@/lib/orderStatus";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();
  const { summary, loading, fetchWishlist, removeItem } = useWishlistStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/wishlist");
    }
  }, [checked, user, router]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  if (!checked || !user) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Verificando sesión...
      </main>
    );
  }

  if (loading && !summary) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando...
      </main>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500">Tu lista de deseos está vacía.</p>
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Mis favoritos</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {summary.items.map((item) => (
          <div key={item.id} className="relative rounded-lg border border-gray-200 bg-white p-3">
            <button
              type="button"
              onClick={() => removeItem(item.producto.id)}
              aria-label="Quitar de favoritos"
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
            >
              ❤️
            </button>
            <Link href={`/productos/${item.producto.id}`}>
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                {item.producto.imagen_principal && (
                  <Image
                    src={item.producto.imagen_principal}
                    alt={item.producto.nombre}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-medium text-gray-800">
                {item.producto.nombre}
              </h3>
              <p className="mt-1 font-bold text-blue-700">{formatPrecio(item.producto.precio)}</p>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
