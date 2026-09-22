"use client";

import Image from "next/image";
import { useState } from "react";

import ResenaForm from "@/components/product/ResenaForm";
import type { Resena } from "@/lib/types";

type TabId = "descripcion" | "especificaciones" | "resenas";

export default function ProductoTabs({
  productId,
  descripcion,
  specs,
  caracteristicas,
  resenas,
}: {
  productId: number;
  descripcion: string;
  specs: { label: string; value: string }[];
  caracteristicas: string[];
  resenas: Resena[];
}) {
  const [tab, setTab] = useState<TabId>("descripcion");

  const tabs: { id: TabId; label: string }[] = [
    { id: "descripcion", label: "Descripción" },
    { id: "especificaciones", label: "Especificaciones" },
    { id: "resenas", label: `Reseñas (${resenas.length})` },
  ];

  return (
    <div>
      <div className="flex gap-6 border-b border-gray-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition ${
              tab === t.id
                ? "border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {tab === "descripcion" && (
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Descripción del Producto
            </h3>
            <p className="whitespace-pre-line text-sm text-gray-700 dark:text-slate-300">
              {descripcion || "Este producto no tiene descripción disponible."}
            </p>
          </div>
        )}

        {tab === "especificaciones" && (
          <div>
            {specs.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt className="text-gray-400 dark:text-slate-500">{s.label}</dt>
                    <dd className="font-medium text-gray-800 dark:text-slate-200">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {caracteristicas.length > 0 && (
              <div className={specs.length > 0 ? "mt-6" : ""}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Características
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-slate-300">
                  {caracteristicas.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {specs.length === 0 && caracteristicas.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No hay especificaciones disponibles para este producto.
              </p>
            )}
          </div>
        )}

        {tab === "resenas" && (
          <div>
            <div className="mb-4">
              <ResenaForm productId={productId} />
            </div>

            {resenas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no hay reseñas para este producto.</p>
            ) : (
              <div className="space-y-3">
                {resenas.map((resena) => (
                  <div key={resena.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-slate-200">{resena.usuario_nombre}</p>
                      <span className="text-amber-400">{"★".repeat(resena.calificacion)}</span>
                    </div>
                    {resena.titulo && (
                      <p className="mt-1 font-medium text-gray-700 dark:text-slate-300">{resena.titulo}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{resena.comentario}</p>
                    {resena.foto && (
                      <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={resena.foto}
                          alt={`Foto de la reseña de ${resena.usuario_nombre}`}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
