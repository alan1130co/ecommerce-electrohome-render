import CategoriaForm from "@/components/dashboard/CategoriaForm";
import { adminApiGet } from "@/lib/api-admin";
import type { CategoriaAdmin } from "@/lib/dashboard-types";

export default async function EditarCategoriaPage(props: PageProps<"/dashboard/categorias/[id]/editar">) {
  const { id } = await props.params;
  const categoria = await adminApiGet<CategoriaAdmin>(`/api/dashboard/categorias/${id}/`);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar: {categoria.nombre}</h1>
      <CategoriaForm categoria={categoria} />
    </div>
  );
}
