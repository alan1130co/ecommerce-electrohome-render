import Link from "next/link";

import CategoriaForm from "@/components/dashboard/CategoriaForm";
import { adminApiGet } from "@/lib/api-admin";
import type { CategoriaAdmin } from "@/lib/dashboard-types";

export default async function EditarCategoriaPage(props: PageProps<"/dashboard/categorias/[id]/editar">) {
  const { id } = await props.params;
  const categoria = await adminApiGet<CategoriaAdmin>(`/api/dashboard/categorias/${id}/`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-list text-amber-500" /> Editar: {categoria.nombre}
        </h1>
        <Link
          href="/dashboard/categorias"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <i className="fas fa-arrow-left mr-1" /> Volver a Categorías
        </Link>
      </div>
      <CategoriaForm categoria={categoria} cardTitle={`Editar: ${categoria.nombre}`} />
    </div>
  );
}
