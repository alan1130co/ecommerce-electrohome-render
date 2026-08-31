"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

export default function VerificarEmailPage() {
  const params = useParams<{ uidb64: string; token: string }>();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiClientFetch<{ detail: string }>(
      `/api/auth/verify-email/${params.uidb64}/${params.token}/`,
    )
      .then((res) => {
        setStatus("ok");
        setMessage(res.detail);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiClientError ? err.message : "No se pudo verificar el correo");
      });
  }, [params.uidb64, params.token]);

  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
      {status === "loading" && <p className="text-gray-500">Verificando tu cuenta...</p>}

      {status === "ok" && (
        <>
          <p className="text-4xl">🎉</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">¡Cuenta verificada!</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <Link
            href="/cuenta/login"
            className="mt-6 inline-block rounded bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Iniciar sesión
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Enlace inválido</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <Link
            href="/cuenta/reenviar-verificacion"
            className="mt-6 inline-block text-blue-700 hover:underline"
          >
            Solicitar un nuevo enlace
          </Link>
        </>
      )}
    </main>
  );
}
