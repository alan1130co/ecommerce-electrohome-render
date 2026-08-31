import PromocionForm from "@/components/dashboard/PromocionForm";
import { adminApiGet } from "@/lib/api-admin";

export default async function NuevaPromocionPage() {
  const productos = await adminApiGet<{ id: number; nombre: string }[]>("/api/dashboard/productos/opciones/");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear promoción</h1>
      <PromocionForm productos={productos} />
    </div>
  );
}
