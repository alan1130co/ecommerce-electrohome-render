"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch } from "@/lib/api-client";
import { formatFecha, formatPrecio, statusColor } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function PedidosPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/pedidos");
    }
  }, [checked, user, router]);

  useEffect(() => {
    if (!user) return;
    apiClientFetch<Order[]>("/api/orders/")
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar tus pedidos"));
    // user cambia de referencia en cada fetchMe() aunque sea la misma
    // persona — usar user.id evita refetches redundantes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!checked || !user) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Verificando sesión...
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-red-500">{error}</main>
    );
  }

  if (!orders) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando pedidos...
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500">Todavía no tienes pedidos.</p>
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Mis pedidos</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/pedidos/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-800">#{order.order_number}</p>
              <p className="text-sm text-gray-500">{formatFecha(order.created_at)}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}
            >
              {order.status_display}
            </span>
            <p className="font-bold text-blue-700">{formatPrecio(order.total)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
