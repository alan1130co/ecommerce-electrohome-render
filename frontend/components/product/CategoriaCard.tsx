import Link from "next/link";

import type { Categoria } from "@/lib/types";

// El modelo Categoria no tiene campo de ícono — se mapea por palabra clave
// del nombre a un ícono de Font Awesome (misma librería que el resto del
// sitio y el dashboard) para no perder la identidad visual de la tira de
// categorías; con categorías nuevas que no matcheen ninguna palabra cae
// al ícono genérico fa-cart-shopping.
const ICONOS: [RegExp, string][] = [
  [/televisor|tv\b/i, "fa-tv"],
  [/consola|gaming|videojuego|entretenimiento/i, "fa-gamepad"],
  [/aire|acondicionado|climatiza/i, "fa-snowflake"],
  [/parlante|audio|sonido|bocina/i, "fa-volume-high"],
  [/lavadora|lavado/i, "fa-shirt"],
  [/aspiradora/i, "fa-broom"],
  [/limpieza/i, "fa-broom"],
  [/licuadora|batidora|cocina/i, "fa-kitchen-set"],
  [/nevera|refrigera/i, "fa-icicles"],
  [/microondas|horno/i, "fa-utensils"],
  [/celular|telefono|movil/i, "fa-mobile"],
  [/computador|laptop|portatil/i, "fa-laptop"],
  [/cuidado personal|belleza/i, "fa-spa"],
  [/salud|suplemento/i, "fa-capsules"],
];

function iconoPara(nombre: string) {
  const match = ICONOS.find(([re]) => re.test(nombre));
  return match ? match[1] : "fa-cart-shopping";
}

export default function CategoriaCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link href={`/productos?categoria=${categoria.id}`} className="cat-card">
      <div className="cat-icon-wrap">
        <i className={`fas ${iconoPara(categoria.nombre)}`} />
      </div>
      <span className="cat-label">{categoria.nombre}</span>
    </Link>
  );
}
