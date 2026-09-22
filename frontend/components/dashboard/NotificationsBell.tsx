"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiClientFetch } from "@/lib/api-client";

interface NotifPedido {
  id: number;
  usuario: string;
  total: string;
  fecha: string;
}

interface NotifResponse {
  pedidos: NotifPedido[];
  count: number;
}

// Espeja dashboard/base.html (legacy): polling cada 30s, el badge solo
// aparece cuando el pedido más nuevo cambia respecto al último visto en
// esta carga de página (no simplemente "count > 0" al abrir).
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [pedidos, setPedidos] = useState<NotifPedido[] | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const ultimoIdVisto = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await apiClientFetch<NotifResponse>("/api/dashboard/notificaciones/");
        setPedidos(data.pedidos);

        const hayNuevos =
          data.pedidos.length > 0 &&
          ultimoIdVisto.current !== null &&
          data.pedidos[0].id !== ultimoIdVisto.current;

        if (hayNuevos) setBadgeCount(data.count);
        if (ultimoIdVisto.current === null && data.pedidos.length > 0) {
          ultimoIdVisto.current = data.pedidos[0].id;
        }
      } catch {
        // silencioso — igual que el script original
      }
    };
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setBadgeCount(null);
        }}
        aria-label="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-amber-500 hover:bg-amber-500/30 hover:text-amber-500"
      >
        <i className="fas fa-bell" />
        {badgeCount !== null && (
          <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-slate-900">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="bg-linear-to-br from-slate-900 to-blue-900 px-4 py-3 text-sm font-bold text-white">
            <i className="fas fa-bell mr-2" /> Pedidos Recientes (24h)
          </div>
          <div>
            {pedidos === null ? (
              <div className="p-4 text-center text-sm text-slate-400">Cargando...</div>
            ) : pedidos.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Sin pedidos recientes</div>
            ) : (
              pedidos.map((p) => (
                <Link
                  key={p.id}
                  href="/dashboard/pedidos"
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="text-sm text-slate-900 dark:text-slate-100">
                      #{p.id} — {p.usuario}
                    </strong>
                    <small className="shrink-0 text-slate-400">{p.fecha}</small>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">${p.total}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
