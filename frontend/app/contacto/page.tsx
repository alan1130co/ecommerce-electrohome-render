"use client";

import { useState } from "react";

import { apiClientFetch } from "@/lib/api-client";
import { emailFormatError, nombreError, telefonoError } from "@/lib/validation";

const ASUNTOS = [
  "Consulta general",
  "Soporte técnico",
  "Estado de mi pedido",
  "Devoluciones y garantías",
  "Sugerencias",
  "Otro",
];

const REDES = [
  { nombre: "Facebook", handle: "@electrohome", icono: "fab fa-facebook-f", href: "https://facebook.com", color: "bg-blue-600" },
  { nombre: "Instagram", handle: "@electrohome", icono: "fab fa-instagram", href: "https://instagram.com", color: "bg-pink-600" },
  { nombre: "TikTok", handle: "@electrohome", icono: "fab fa-tiktok", href: "https://tiktok.com", color: "bg-gray-900 dark:bg-slate-700" },
  { nombre: "Twitter / X", handle: "@electrohome", icono: "fab fa-x-twitter", href: "https://twitter.com", color: "bg-gray-900 dark:bg-slate-700" },
];

// Mismo patrón visual que las cards de checkout/PedidoConfirmacion: sin
// borde de acento, un solo ícono en el título, sombra suave.
function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-800 dark:text-blue-300">
        <i className={icon} /> {title}
      </h2>
      {children}
    </div>
  );
}

// Mismo Field que components/checkout: label simple sin ícono, mismo input.
function Field({
  label,
  id,
  error,
  required,
  ...props
}: { label: string; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        required={required}
        {...props}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {error && <p className="mt-1 text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function Stat({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-yellow-400">{valor}</div>
      <div className="text-xs uppercase tracking-wide text-blue-100">{etiqueta}</div>
    </div>
  );
}

export default function ContactoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Si el archivo no carga (conexión lenta, formato no soportado), se oculta
  // el <video> y queda el degradado azul de la sección como fondo sólido.
  const [videoFailed, setVideoFailed] = useState(false);

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const liveErrors = {
    name: nombreError(form.name),
    email: emailFormatError(form.email),
    phone: telefonoError(form.phone),
  };
  const hasLiveErrors = Object.values(liveErrors).some(Boolean);

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
    <>
      {/* El degradado azul queda siempre puesto como fondo de la sección
          (no solo mientras carga): si el video falla, tarda, o el navegador
          no lo soporta, esto es lo que se ve — nunca un espacio roto/negro.
          Altura por breakpoint: más baja en mobile, más alta en desktop, para
          que el video se aprecie sin quedar exagerado en pantallas chicas. */}
      <section className="relative flex min-h-80 items-center justify-center overflow-hidden bg-linear-to-br from-blue-700 via-blue-800 to-blue-900 px-4 py-12 text-center text-white sm:min-h-105 lg:min-h-140 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950">
        {!videoFailed && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoFailed(true)}
          >
            <source src="/videos/video_contacto_electrohome.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-blue-950/60 dark:bg-black/50" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-2xl shadow-lg">
            <i className="fas fa-envelope" />
          </div>
          <h1 className="mt-6 text-4xl font-bold">Contáctanos</h1>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Estamos aquí para ayudarte. Envíanos tu mensaje y te responderemos pronto.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-8 rounded-2xl bg-white/10 px-8 py-6 backdrop-blur-sm">
            <Stat valor="24h" etiqueta="Tiempo de respuesta" />
            <Stat valor="98%" etiqueta="Clientes satisfechos" />
            <Stat valor="5★" etiqueta="Calificación promedio" />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card icon="fas fa-paper-plane" title="Envíanos un mensaje">
              {done ? (
                <p className="rounded-md bg-green-50 p-4 text-center text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  {done}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>}

                  <Field
                    label="Nombre Completo"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={handleChange("name")}
                    error={liveErrors.name}
                    required
                  />

                  <Field
                    label="Correo Electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={handleChange("email")}
                    error={liveErrors.email}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Teléfono (opcional)"
                      type="tel"
                      placeholder="3001234567"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      error={liveErrors.phone}
                      maxLength={10}
                    />

                    <div>
                      <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Asunto
                      </label>
                      <select
                        id="subject"
                        value={form.subject}
                        onChange={handleChange("subject")}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Selecciona un asunto</option>
                        {ASUNTOS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Mensaje <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      placeholder="Escribe tu mensaje aquí..."
                      rows={4}
                      value={form.message}
                      onChange={handleChange("message")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || hasLiveErrors}
                    className="w-full rounded-md bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                  >
                    {sending ? "Enviando..." : "Enviar Mensaje"}
                  </button>
                </form>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card icon="fas fa-info-circle" title="Información de Contacto">
              <div className="divide-y divide-gray-200 text-sm dark:divide-slate-700">
                <div className="pb-3">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Dirección</p>
                  <p className="mt-0.5 font-medium text-gray-800 dark:text-slate-200">
                    Calle 1 #2-40, Cartagena de Indias, Colombia
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Teléfono</p>
                  <p className="mt-0.5 font-medium text-gray-800 dark:text-slate-200">+57 300 760 7645</p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Email</p>
                  <a
                    href="mailto:info@electrohome.com"
                    className="mt-0.5 block font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    info@electrohome.com
                  </a>
                </div>
                <div className="pt-3">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Horario</p>
                  <p className="mt-0.5 font-medium text-gray-800 dark:text-slate-200">
                    Lun - Vie: 8:00 AM – 6:00 PM
                    <br />
                    Sábados: 9:00 AM – 2:00 PM
                    <br />
                    Domingos: Cerrado
                  </p>
                </div>
              </div>
            </Card>

            <Card icon="fas fa-share-alt" title="Síguenos en Redes">
              <div className="space-y-2">
                {REDES.map((red) => (
                  <a
                    key={red.nombre}
                    href={red.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-800 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${red.color}`}>
                        <i className={red.icono} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{red.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{red.handle}</p>
                      </div>
                    </div>
                    <i className="fas fa-arrow-right text-gray-400 dark:text-slate-500" />
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Ancho completo en vez de apilada en la columna derecha — así no
            deja un hueco vacío debajo del formulario, y un mapa real
            (cuando lo haya) se beneficia del espacio horizontal. */}
        <div className="mt-6">
          <Card icon="fas fa-map" title="Ubicación">
            {/* Todavía no hay integración real de mapas — placeholder honesto
                en vez de simular un mapa interactivo que no funciona. */}
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-400 dark:bg-slate-900 dark:text-slate-600">
              <i className="fas fa-map-marked-alt text-3xl" />
              <span className="text-sm">Mapa próximamente</span>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
