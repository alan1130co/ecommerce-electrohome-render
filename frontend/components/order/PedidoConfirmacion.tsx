"use client";

import Image from "next/image";
import Link from "next/link";

import { formatFecha, formatPrecio, statusColor } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

// Reutilizado por la confirmación al final del checkout y por el detalle
// de un pedido ya existente en /pedidos/[id] — en producción ambas
// pantallas comparten exactamente esta misma estructura.
export default function PedidoConfirmacion({ order }: { order: Order }) {
  const user = useAuthStore((s) => s.user);
  const nombreDestinatario = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  return (
    <>
      <div className="rounded-lg border border-green-200 bg-white p-10 text-center shadow-md dark:border-green-800 dark:bg-slate-800">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
          <i className="fas fa-check text-3xl text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-blue-800 dark:text-blue-300">¡Pedido Confirmado!</h1>
        <p className="mt-1 text-gray-600 dark:text-slate-400">Gracias por tu compra en ElectroHome</p>
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-bold text-blue-800 dark:text-blue-300">Detalles del Pedido</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Número de Pedido</p>
            <p className="font-bold text-blue-700 dark:text-blue-400">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Fecha</p>
            <p className="font-medium text-gray-800 dark:text-slate-200">{formatFecha(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Estado</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(order.status)}`}>
              {order.status_display}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Método de Pago</p>
            <p className="font-medium text-gray-800 dark:text-slate-200">{order.payment_method_display}</p>
          </div>
        </div>

        <div className="my-5 border-t border-gray-200 dark:border-slate-700" />

        <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
          <i className="fas fa-map-marker-alt" /> Dirección de Envío
        </h3>
        <div className="rounded-md bg-gray-50 p-4 text-sm dark:bg-slate-900">
          {nombreDestinatario && <p className="font-bold text-gray-800 dark:text-slate-200">{nombreDestinatario}</p>}
          <p className="text-gray-700 dark:text-slate-300">{order.shipping_address}</p>
          <p className="text-gray-700 dark:text-slate-300">
            {order.shipping_city}, {order.shipping_department}
          </p>
          <p className="mt-2 text-gray-700 dark:text-slate-300">
            <i className="fas fa-phone" /> {order.phone}
          </p>
          <p className="text-gray-700 dark:text-slate-300">
            <i className="fas fa-envelope" /> {order.email}
          </p>
        </div>

        <h3 className="mt-5 mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
          <i className="fas fa-shopping-bag" /> Productos
        </h3>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-slate-900">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-slate-200">
                {item.product_image && (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800 dark:text-slate-200">{item.product_name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Cantidad: {item.quantity}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Precio unitario: {formatPrecio(item.product_price)}</p>
              </div>
              <p className="shrink-0 font-semibold text-blue-700 dark:text-blue-400">{formatPrecio(item.subtotal)}</p>
            </li>
          ))}
        </ul>

        <div className="my-5 border-t border-gray-200 dark:border-slate-700" />

        <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrecio(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (19%):</span>
            <span>{formatPrecio(order.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío:</span>
            <span>{formatPrecio(order.shipping_cost)}</span>
          </div>
        </div>

        <div className="my-3 border-t border-gray-200 dark:border-slate-700" />

        <div className="flex justify-between text-lg font-bold text-blue-700 dark:text-blue-400">
          <span>Total:</span>
          <span>{formatPrecio(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-500/10">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
          <i className="fas fa-info-circle" /> ¿Qué sigue?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-600 dark:text-green-400" />
            <span>
              Recibirás un correo de confirmación en <strong>{order.email}</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-600 dark:text-green-400" />
            <span>Te contactaremos para coordinar la entrega</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check text-green-600 dark:text-green-400" />
            <span>Puedes seguir el estado de tu pedido en &quot;Mis Pedidos&quot;</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link
          href="/pedidos"
          className="flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          <i className="fas fa-bars" /> Ver Mis Pedidos
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600"
        >
          <i className="fas fa-home" /> Volver al Inicio
        </Link>
      </div>
    </>
  );
}
