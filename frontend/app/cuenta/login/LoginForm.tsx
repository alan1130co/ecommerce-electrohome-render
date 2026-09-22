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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-slate-800">
        <div className="bg-linear-to-br from-blue-600 to-blue-800 px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <i className="fas fa-user text-3xl text-blue-700" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Bienvenido</h1>
          <p className="mt-1 text-sm text-blue-100">Inicia sesión en ElectroHome</p>
        </div>

        <div className="px-8 py-8">
          <GoogleLoginButton />

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            O inicia sesión con email
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>}

            <div>
              <label htmlFor="email" className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-300">
                <i className="fas fa-envelope text-blue-700 dark:text-blue-400" /> Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-300">
                <i className="fas fa-lock text-blue-700 dark:text-blue-400" /> Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Recordarme
              </label>
              <Link href="/cuenta/recuperar-password" className="text-blue-700 hover:underline dark:text-blue-400">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              <i className="fas fa-sign-in-alt" /> {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="my-5 border-t border-gray-200 dark:border-slate-700" />

          <p className="text-center text-sm text-gray-600 dark:text-slate-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/cuenta/registro" className="font-bold text-blue-700 hover:underline dark:text-blue-400">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
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
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <GoogleIcon /> Continuar con Google
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
