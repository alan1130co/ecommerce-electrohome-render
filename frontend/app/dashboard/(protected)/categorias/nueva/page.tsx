import Link from "next/link";

import CategoriaForm from "@/components/dashboard/CategoriaForm";

export default function NuevaCategoriaPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-list text-amber-500" /> Crear Nueva Categoría
        </h1>
        <Link
          href="/dashboard/categorias"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <i className="fas fa-arrow-left mr-1" /> Volver a Categorías
        </Link>
      </div>
      <CategoriaForm cardTitle="Crear Nueva Categoría" />
    </div>
  );
}
