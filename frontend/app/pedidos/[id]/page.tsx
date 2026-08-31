"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import { formatFecha, formatPrecio, statusColor } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function PedidoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (checked && !user) {
      router.push(`/cuenta/login?next=/pedidos/${params.id}`);
    }
  }, [checked, user, router, params.id]);

  useEffect(() => {
    if (!user) return;
    apiClientFetch<Order>(`/api/orders/${params.id}/`)
      .then(setOrder)
      .catch((e) => {
        if (e instanceof ApiClientError && e.status === 404) {
          setNotFound(true);
        } else {
          setError(e instanceof Error ? e.message : "No se pudo cargar el pedido");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, params.id]);

  if (!checked || !user) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Verificando sesión...
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500">No encontramos ese pedido.</p>
        <Link href="/pedidos" className="mt-4 inline-block text-blue-700 hover:underline">
          Ver mis pedidos
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-red-500">{error}</main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando pedido...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/pedidos" className="text-sm text-blue-700 hover:underline">
        ← Mis pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.order_number}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(order.status)}`}>
          {order.status_display}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{formatFecha(order.created_at)}</p>

      <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        💵 Pago <strong>contraentrega</strong> ({order.payment_method_display}) — pagas en
        efectivo al recibir tu pedido.
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          Productos
        </h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {item.product_image && (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} x {formatPrecio(item.product_price)}
                </p>
              </div>
              <p className="font-semibold text-blue-700">{formatPrecio(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Envío
          </h2>
          <p className="text-sm text-gray-700">{order.shipping_address}</p>
          <p className="text-sm text-gray-700">
            {order.shipping_city}, {order.shipping_department}
          </p>
          {order.shipping_postal_code && (
            <p className="text-sm text-gray-700">CP: {order.shipping_postal_code}</p>
          )}
          <p className="text-sm text-gray-700">Tel: {order.phone}</p>
        </div>

        <div className="text-sm text-gray-700">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Total</h2>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrecio(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (19%)</span>
            <span>{formatPrecio(order.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{formatPrecio(order.shipping_cost)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 text-base font-bold text-blue-700">
            <span>Total</span>
            <span>{formatPrecio(order.total)}</span>
          </div>
        </div>
      </section>

      {order.notes && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Notas</h2>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </section>
      )}
    </main>
  );
}
