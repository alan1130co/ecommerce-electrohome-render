import CategoriaCard from "@/components/product/CategoriaCard";
import ProductCard from "@/components/product/ProductCard";
import SeccionPromocionalBlock from "@/components/product/SeccionPromocionalBlock";
import { apiGet } from "@/lib/api";
import type { HomeData, ProductoResumen } from "@/lib/types";

export default async function Home() {
  const data = await apiGet<HomeData>("/api/home/");

  // Igual que en Categoria.objects.filter(activo=True) de la vista de
  // Django: /api/home/ trae categorías padre e hijas mezcladas. Para el
  // grid de "explora por categoría" solo mostramos las padre.
  const categoriasPadre = data.categorias.filter((c) => c.parent === null);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-8">
      {categoriasPadre.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-800">Categorías</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categoriasPadre.map((categoria) => (
              <CategoriaCard key={categoria.id} categoria={categoria} />
            ))}
          </div>
        </section>
      )}

      <ProductSection titulo="Ofertas especiales" productos={data.ofertas_especiales} />

      {data.secciones_vigentes.map((seccion) => (
        <SeccionPromocionalBlock key={seccion.id} seccion={seccion} />
      ))}

      <ProductSection titulo="Recomendados para ti" productos={data.recomendados} />
      <ProductSection titulo="Más vendidos" productos={data.mas_vendidos} />
      <ProductSection titulo="Recién llegados" productos={data.nuevos} />
    </main>
  );
}

function ProductSection({
  titulo,
  productos,
}: {
  titulo: string;
  productos: ProductoResumen[];
}) {
  if (productos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-800">{titulo}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {productos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </section>
  );
}
