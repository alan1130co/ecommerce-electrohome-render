"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  // Refleja el término activo cuando se está en /buscar (igual que el
  // template de producción, que precarga el input con el `q` actual);
  // al salir de /buscar se limpia, como pasaría con una recarga completa.
  useEffect(() => {
    setQuery(pathname?.startsWith("/buscar") ? (searchParams.get("q") ?? "") : "");
  }, [pathname, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-4 flex min-w-0 max-w-2xl grow">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos..."
        className="search-input-big min-w-0 flex-1 rounded-l-xl border-2 border-blue-300 bg-white px-5 py-3 text-base text-gray-800 focus:border-yellow-400 focus:outline-none"
      />
      <button
        type="submit"
        className="search-btn-big shrink-0 rounded-r-xl bg-yellow-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-yellow-600"
      >
        <i className="fas fa-search" />
      </button>
    </form>
  );
}
