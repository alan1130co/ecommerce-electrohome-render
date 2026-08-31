"use client";

import { useState } from "react";

import { apiClientFetch } from "@/lib/api-client";

export default function ContactoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await apiClientFetch<{ detail: string }>("/api/contact/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone(res.detail);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Contáctanos</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        ¿Tienes preguntas? Escríbenos y te responderemos pronto.
      </p>

      {done ? (
        <p className="rounded-md bg-green-50 p-4 text-center text-sm font-medium text-green-700">
          {done}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <input
            type="text"
            required
            placeholder="Tu nombre"
            value={form.name}
            onChange={handleChange("name")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="email"
            required
            placeholder="Tu correo electrónico"
            value={form.email}
            onChange={handleChange("email")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={form.phone}
            onChange={handleChange("phone")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Asunto"
            value={form.subject}
            onChange={handleChange("subject")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            required
            placeholder="Tu mensaje"
            rows={4}
            value={form.message}
            onChange={handleChange("message")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      )}
    </main>
  );
}
