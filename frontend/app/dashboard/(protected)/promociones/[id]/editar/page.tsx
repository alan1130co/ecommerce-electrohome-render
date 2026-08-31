import PromocionForm from "@/components/dashboard/PromocionForm";
import { adminApiGet } from "@/lib/api-admin";
import type { PromocionAdmin } from "@/lib/dashboard-types";

export default async function EditarPromocionPage(props: PageProps<"/dashboard/promociones/[id]/editar">) {
  const { id } = await props.params;

  const [promocion, productos] = await Promise.all([
    adminApiGet<PromocionAdmin>(`/api/dashboard/promociones/${id}/`),
    adminApiGet<{ id: number; nombre: string }[]>("/api/dashboard/productos/opciones/"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar promoción: {promocion.producto_nombre}</h1>
      <PromocionForm productos={productos} promocion={promocion} />
    </div>
  );
}
