import CatalogProductCard from "@/components/product/CatalogProductCard";
import type { SeccionPromocional } from "@/lib/types";

const ACCENT_STYLE: Record<string, string> = {
  red: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
  blue: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)",
  yellow: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
  green: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
  purple: "linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)",
  black: "linear-gradient(180deg, #111827 0%, #000000 100%)",
  orange: "linear-gradient(180deg, #f97316 0%, #ea580c 100%)",
};

// Secciones tipo "Black Friday": vienen de SeccionPromocional + ProductoSeccion
// (application/product/models.py). El descuento es específico de la sección,
// no el `promocion_activa` genérico del producto. No existe en el diseño
// original (se agregó a la API después de esa versión del template) — se
// estiliza con el mismo lenguaje visual que "Ofertas especiales" para que
// no desentone con el resto de la página.
export default function SeccionPromocionalBlock({
  seccion,
}: {
  seccion: SeccionPromocional;
}) {
  if (seccion.productos_seccion.length === 0) return null;

  const accent = ACCENT_STYLE[seccion.color_acento] ?? ACCENT_STYLE.red;
  const items = [...seccion.productos_seccion].sort((a, b) => a.orden - b.orden);

  return (
    <section className="section-white py-16">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-accent-bar" style={{ background: accent }} />
            <div>
              <div className="section-title">
                {seccion.icono} {seccion.nombre}
              </div>
              {seccion.subtitulo && <div className="section-subtitle">{seccion.subtitulo}</div>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CatalogProductCard
              key={item.id}
              producto={item.producto}
              promoOverride={{
                precioPromocional: item.precio_promocional,
                etiqueta: `-${Number(item.descuento_porcentaje)}%`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
