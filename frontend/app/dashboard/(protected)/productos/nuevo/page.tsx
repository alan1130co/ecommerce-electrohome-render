import ProductoForm from "@/components/dashboard/ProductoForm";
import { apiGet } from "@/lib/api";
import type { Categoria } from "@/lib/types";

export default async function NuevoProductoPage() {
  const categorias = await apiGet<Categoria[]>("/api/categorias/");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear nuevo producto</h1>
      <ProductoForm categorias={categorias} />
    </div>
  );
}
