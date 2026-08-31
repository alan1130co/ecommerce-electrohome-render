import Link from "next/link";

import type { Categoria } from "@/lib/types";

// El modelo Categoria no tiene campo de ícono (a diferencia de
// SeccionPromocional), así que se muestra solo el nombre en vez de
// inventar un mapeo de emojis que no vive en los datos.
export default function CategoriaCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link
      href={`/productos?categoria=${categoria.id}`}
      className="flex min-w-[110px] flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-5 text-center transition hover:border-blue-400 hover:shadow-sm"
    >
      <span className="text-sm font-semibold text-gray-700">{categoria.nombre}</span>
    </Link>
  );
}
