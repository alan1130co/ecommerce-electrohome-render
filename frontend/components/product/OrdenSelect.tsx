"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPCIONES = [
  { value: "nuevo", label: "Más recientes" },
  { value: "antiguo", label: "Más antiguos" },
  { value: "precio_asc", label: "Precio: Menor a Mayor" },
  { value: "precio_desc", label: "Precio: Mayor a Menor" },
  { value: "nombre_asc", label: "Nombre: A-Z" },
  { value: "nombre_desc", label: "Nombre: Z-A" },
];

// Los value deben coincidir con ORDEN_OPCIONES en api_views.py (backend).
// basePath permite reutilizar el mismo select en /productos y en /buscar.
export default function OrdenSelect({ basePath = "/productos" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ordenActual = searchParams.get("orden") ?? "nuevo";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams);
    next.set("orden", e.target.value);
    next.delete("page");
    router.push(`${basePath}?${next.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label className="font-semibold text-gray-700 dark:text-slate-300">Ordenar por:</label>
      <select
        value={ordenActual}
        onChange={handleChange}
        className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        {OPCIONES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
