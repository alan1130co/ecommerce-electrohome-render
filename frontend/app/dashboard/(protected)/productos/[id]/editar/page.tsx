import Link from "next/link";

import ProductoForm from "@/components/dashboard/ProductoForm";
import { apiGet } from "@/lib/api";
import { adminApiGet } from "@/lib/api-admin";
import type { Categoria, ProductoDetalle } from "@/lib/types";

export default async function EditarProductoPage(props: PageProps<"/dashboard/productos/[id]/editar">) {
  const { id } = await props.params;

  const [producto, categorias] = await Promise.all([
    adminApiGet<ProductoDetalle>(`/api/dashboard/productos/${id}/`),
    apiGet<Categoria[]>("/api/categorias/"),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-box text-amber-500" /> Editar: {producto.nombre}
        </h1>
        <Link
          href="/dashboard/productos"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <i className="fas fa-arrow-left mr-1" /> Volver a Productos
        </Link>
      </div>
      <ProductoForm categorias={categorias} producto={producto} />
    </div>
  );
}
