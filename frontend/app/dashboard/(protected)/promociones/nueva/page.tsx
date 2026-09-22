import Link from "next/link";

import PromocionForm from "@/components/dashboard/PromocionForm";
import { adminApiGet } from "@/lib/api-admin";

export default async function NuevaPromocionPage() {
  const productos = await adminApiGet<{ id: number; nombre: string }[]>("/api/dashboard/productos/opciones/");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-tag text-amber-500" /> Crear Promoción
        </h1>
        <Link
          href="/dashboard/promociones"
          className="rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <i className="fas fa-arrow-left mr-1" /> Volver
        </Link>
      </div>
      <PromocionForm productos={productos} cardTitle="Crear Promoción" />
    </div>
  );
}
