"use client";

import { useEffect, useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { PuedeResenarStatus, Resena } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function ResenaForm({ productId }: { productId: number }) {
  const { user, checked, fetchMe } = useAuthStore();
  const [status, setStatus] = useState<PuedeResenarStatus | null>(null);
  const [calificacion, setCalificacion] = useState(5);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Resena | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    apiClientFetch<PuedeResenarStatus>(`/api/productos/${productId}/puede-resenar/`).then(setStatus);
  }, [productId]);

  if (!checked || !status) return null;

  if (!user) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/cuenta/login" className="text-blue-700 hover:underline">
          Inicia sesión
        </a>{" "}
        para dejar una reseña (solo si ya recibiste el producto).
      </p>
    );
  }

  if (sent) {
    return (
      <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
        ¡Gracias! Tu reseña quedó pendiente de aprobación.
      </p>
    );
  }

  if (status.ya_reseno) {
    return <p className="text-sm text-gray-500">Ya dejaste una reseña para este producto.</p>;
  }

  if (!status.puede_resenar) {
    return (
      <p className="text-sm text-gray-500">
        Solo puedes reseñar productos que hayas recibido en un pedido entregado.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("calificacion", String(calificacion));
      formData.append("titulo", titulo);
      formData.append("comentario", comentario);
      if (foto) formData.append("foto", foto);

      const resena = await apiClientFetch<Resena>(`/api/productos/${productId}/resenas/`, {
        method: "POST",
        body: formData,
      });
      setSent(resena);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo enviar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-800">Deja tu reseña</h3>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCalificacion(n)}
            aria-label={`${n} estrellas`}
            className={`text-2xl ${n <= calificacion ? "text-amber-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Título (opcional)"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <textarea
        required
        placeholder="Cuéntanos qué te pareció el producto"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}
