"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useAuthStore } from "@/store/authStore";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push(searchParams.get("next") || "/");
    } catch {
      // el error ya queda en el store (useAuthStore.error)
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Iniciar sesión
      </h1>

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
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-2 text-center text-sm">
        <Link href="/cuenta/recuperar-password" className="text-blue-700 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        o
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleLoginButton />

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/cuenta/registro" className="font-medium text-blue-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}

function GoogleLoginButton() {
  // allauth es un flujo de redirect de página completa (no fetch/JSON), así
  // que va directo al origen real de Django — no pasa por el rewrite proxy
  // de /api/*. Django corre en localhost:8000 (mismo host que Next.js,
  // solo distinto puerto) para que la cookie de sesión resultante sea
  // visible también para localhost:3000 — las cookies no distinguen puerto.
  const djangoOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const nextOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const googleLoginUrl = `${djangoOrigin}/accounts/google/login/?process=login&next=${encodeURIComponent(nextOrigin + "/")}`;

  return (
    <a
      href={googleLoginUrl}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      Continuar con Google
    </a>
  );
}
