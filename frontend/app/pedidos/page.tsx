import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { userApiGetSafe } from "@/lib/api-user";
import { formatFecha, formatPrecio, statusColor, statusIcon } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";

export default async function PedidosPage() {
  const result = await userApiGetSafe<Order[]>("/api/orders/");
  if (!result.ok) {
    redirect("/cuenta/login?next=/pedidos");
  }
  const orders = result.data;

  if (orders.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800 dark:text-blue-300">
          <i className="fas fa-shopping-bag" /> Mis Pedidos
        </h1>
        <div className="rounded-lg bg-white p-16 text-center shadow-md dark:bg-slate-800">
          <p className="text-gray-500 dark:text-slate-400">No tienes pedidos aún</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">¡Realiza tu primera compra!</p>
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

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800 dark:text-blue-300">
        <i className="fas fa-shopping-bag" /> Mis Pedidos
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-slate-800">
            <div className="flex items-center justify-between bg-blue-700 px-5 py-3 text-white">
              <div>
                <p className="font-bold">Pedido #{order.order_number}</p>
                <p className="flex items-center gap-1 text-xs text-blue-100">
                  <i className="fas fa-calendar" /> {formatFecha(order.created_at)}
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}
              >
                <i className={`fas ${statusIcon(order.status)}`} /> {order.status_display}
              </span>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <i className="fas fa-shopping-bag" /> Productos ({order.items.length})
                </h3>
                <ul className="space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-slate-200">
                        {item.product_image && (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-gray-800 dark:text-slate-200">{item.product_name}</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          Cantidad: {item.quantity} x {formatPrecio(item.product_price)}
                        </span>
                      </div>
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      + {order.items.length - 3} producto{order.items.length - 3 === 1 ? "" : "s"} más
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <i className="fas fa-map-marker-alt" /> Envío
                </h3>
                <p className="text-sm text-gray-700 dark:text-slate-300">{order.shipping_address}</p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {order.shipping_city}, {order.shipping_department}
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                  <i className="fas fa-phone" /> {order.phone}
                </p>

                <h3 className="mt-4 mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <i className="fas fa-credit-card" /> Pago
                </h3>
                <p className="text-sm text-gray-700 dark:text-slate-300">{order.payment_method_display}</p>
              </div>
            </div>

            <div className="my-1 border-t border-gray-200 dark:border-slate-700" />

            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Total pagado</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatPrecio(order.total)}</p>
              </div>
              <Link
                href={`/pedidos/${order.id}`}
                className="flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <i className="fas fa-eye" /> Ver Detalle
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
