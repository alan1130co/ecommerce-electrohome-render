"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

export default function RestablecerPasswordPage() {
  const params = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();

  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      // SetPasswordForm de Django espera exactamente estos nombres de campo.
      await apiClientFetch(`/api/auth/password-reset-confirm/${params.uidb64}/${params.token}/`, {
        method: "POST",
        body: JSON.stringify({ new_password1: newPassword1, new_password2: newPassword2 }),
      });
      setDone(true);
      setTimeout(() => router.push("/cuenta/login"), 2000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: Record<string, string[]>; detail?: string };
        const allErrors = body?.errors
          ? Object.values(body.errors).flat()
          : [body?.detail ?? err.message];
        setErrors(allErrors);
      } else {
        setErrors(["No se pudo restablecer la contraseña"]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Contraseña actualizada</h1>
        <p className="mt-2 text-gray-600">Te llevamos a iniciar sesión...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Nueva contraseña</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.map((msg) => (
          <p key={msg} className="text-sm font-medium text-red-500">
            {msg}
          </p>
        ))}

        <input
          type="password"
          required
          placeholder="Nueva contraseña"
          value={newPassword1}
          onChange={(e) => setNewPassword1(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Confirmar nueva contraseña"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>

      <Link href="/cuenta/login" className="mt-4 text-center text-sm text-blue-700 hover:underline">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
