"use client";

import Link from "next/link";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

export default function ReenviarVerificacionPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiClientFetch<{ detail: string }>("/api/auth/resend-verification/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(res.detail);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo reenviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
        Reenviar verificación
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <p className="text-sm font-medium text-green-600">{message}</p>}
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <input
          type="email"
          required
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Reenviar correo"}
        </button>
      </form>

      <Link href="/cuenta/login" className="mt-4 text-center text-sm text-blue-700 hover:underline">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
