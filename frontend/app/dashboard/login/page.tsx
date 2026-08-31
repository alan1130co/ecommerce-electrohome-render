"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { AdminMe } from "@/lib/dashboard-types";

// Login SEPARADO del de clientes (/cuenta/login): pega a
// /api/dashboard/auth/login/ (AdminLoginAPIView), que rechaza con 403
// cualquier credencial válida que no sea de supervisor/staff — un cliente
// nunca abre sesión desde este formulario, aunque su email/password sean
// correctos.
export default function DashboardLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClientFetch<AdminMe>("/api/dashboard/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Navegación dura (no router.push): acabamos de abrir sesión y
      // vamos a un área protegida cuyo guard hace su propio fetch
      // server-side de auth/me — queremos esa verificación fresca, no una
      // transición client-side cacheada. Verificado en QA: con
      // router.push() el RSC del destino resolvía 200 pero la URL del
      // navegador nunca cambiaba (no confirmado si es un bug de Next 16/
      // Turbopack o de esta app; esto lo evita sin depender de la causa).
      window.location.href = "/dashboard/";
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-center text-xl font-bold text-gray-900">
          ElectroHome <span className="text-blue-700">Admin</span>
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Acceso exclusivo para supervisores y administradores
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar al panel"}
          </button>
        </form>
      </div>
    </main>
  );
}
