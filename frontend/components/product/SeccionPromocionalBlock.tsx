import ProductCard from "@/components/product/ProductCard";
import type { SeccionPromocional } from "@/lib/types";

const COLOR_ACENTO_CLASSES: Record<string, string> = {
  red: "bg-red-600",
  blue: "bg-blue-600",
  yellow: "bg-amber-500",
  green: "bg-green-600",
  purple: "bg-purple-600",
  black: "bg-gray-900",
  orange: "bg-orange-500",
};

// Secciones tipo "Black Friday": vienen de SeccionPromocional + ProductoSeccion
// (application/product/models.py). El descuento es específico de la sección,
// no el promocion_activa genérico del producto.
export default function SeccionPromocionalBlock({
  seccion,
}: {
  seccion: SeccionPromocional;
}) {
  if (seccion.productos_seccion.length === 0) return null;

  const headerColor = COLOR_ACENTO_CLASSES[seccion.color_acento] ?? "bg-red-600";
  const items = [...seccion.productos_seccion].sort((a, b) => a.orden - b.orden);

  return (
    <section>
      <div className={`flex items-center gap-3 rounded-t-lg px-4 py-3 text-white ${headerColor}`}>
        <span className="text-2xl" aria-hidden>
          {seccion.icono}
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight">{seccion.nombre}</h2>
          {seccion.subtitulo && (
            <p className="text-sm leading-tight opacity-90">{seccion.subtitulo}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-b-lg border border-t-0 border-gray-200 bg-white p-4 sm:grid-cols-3 md:grid-cols-5">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            producto={item.producto}
            promoOverride={{
              precioPromocional: item.precio_promocional,
              etiqueta: `-${Number(item.descuento_porcentaje)}%`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
