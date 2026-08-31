"use client";

import Link from "next/link";
import { useState } from "react";

import { apiClientFetch } from "@/lib/api-client";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClientFetch<{ detail: string }>("/api/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDone(res.detail);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
        <p className="mt-2 text-gray-600">{done}</p>
        <Link href="/cuenta/login" className="mt-6 inline-block text-blue-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
        Recuperar contraseña
      </h1>
      <p className="mb-4 text-center text-sm text-gray-500">
        Te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </main>
  );
}
