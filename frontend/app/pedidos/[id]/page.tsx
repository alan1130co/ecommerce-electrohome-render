import Link from "next/link";
import { redirect } from "next/navigation";

import PedidoConfirmacion from "@/components/order/PedidoConfirmacion";
import { userApiGetSafe } from "@/lib/api-user";
import type { Order } from "@/lib/types";

export default async function PedidoDetailPage(props: PageProps<"/pedidos/[id]">) {
  const { id } = await props.params;
  const result = await userApiGetSafe<Order>(`/api/orders/${id}/`);

  if (!result.ok && result.status === 401) {
    redirect(`/cuenta/login?next=/pedidos/${id}`);
  }

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-slate-400">No encontramos ese pedido.</p>
        <Link href="/pedidos" className="mt-4 inline-block text-blue-700 hover:underline dark:text-blue-400">
          Ver mis pedidos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <PedidoConfirmacion order={result.data} />
    </main>
  );
}
