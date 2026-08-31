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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar: {producto.nombre}</h1>
      <ProductoForm categorias={categorias} producto={producto} />
    </div>
  );
}
