import Link from "next/link";

import ProductoForm from "@/components/dashboard/ProductoForm";
import { apiGet } from "@/lib/api";
import type { Categoria } from "@/lib/types";

export default async function NuevoProductoPage() {
  const categorias = await apiGet<Categoria[]>("/api/categorias/");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-box text-amber-500" /> Crear Nuevo Producto
        </h1>
        <Link
          href="/dashboard/productos"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <i className="fas fa-arrow-left mr-1" /> Volver a Productos
        </Link>
      </div>
      <ProductoForm categorias={categorias} />
    </div>
  );
}
