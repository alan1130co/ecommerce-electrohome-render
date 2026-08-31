import Link from "next/link";

export default function VerificacionEnviadaPage() {
  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
      <p className="text-4xl">📬</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
      <p className="mt-2 text-gray-600">
        Te enviamos un enlace de verificación. Revisa tu bandeja de entrada (y spam) para
        activar tu cuenta.
      </p>
      <Link
        href="/cuenta/reenviar-verificacion"
        className="mt-4 inline-block text-sm text-blue-700 hover:underline"
      >
        ¿No te llegó? Reenviar correo
      </Link>
    </main>
  );
}
