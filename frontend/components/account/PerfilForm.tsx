"use client";

import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import { formatPrecio } from "@/lib/orderStatus";
import type { UserProfile } from "@/lib/types";
import { nombreError, telefonoError } from "@/lib/validation";
import { useAuthStore } from "@/store/authStore";

// Lista fija de ciudades — igual a la del template legacy de Django que
// reemplaza esta página (no depende de departamento, a diferencia del
// selector de ciudad del checkout).
const CIUDADES = [
  "Acacías", "Aguachica", "Apartadó", "Arauca", "Armenia", "Barrancabermeja",
  "Barranquilla", "Bello", "Bogotá", "Bucaramanga", "Buenaventura", "Buga",
  "Cajicá", "Calarcá", "Cali", "Cartagena", "Cartago", "Chía", "Ciénaga",
  "Cúcuta", "Dosquebradas", "Duitama", "Envigado", "Espinal", "Facatativá",
  "Florencia", "Floridablanca", "Funza", "Fusagasugá", "Garzón", "Girardot",
  "Girón", "Ibagué", "Inírida", "Ipiales", "Itagüí", "Jamundí", "Leticia",
  "Lorica", "Madrid", "Magangué", "Maicao", "Malambo", "Manizales",
  "Medellín", "Melgar", "Mitú", "Mocoa", "Montenegro", "Montería",
  "Mosquera", "Neiva", "Ocaña", "Palmira", "Pamplona", "Pasto", "Pereira",
  "Piedecuesta", "Pitalito", "Popayán", "Puerto Carreño", "Quibdó",
  "Riohacha", "Rionegro", "Sabaneta", "San Andrés", "San José del Guaviare",
  "Santa Marta", "Santa Rosa de Cabal", "Sibaté", "Sincelejo", "Soacha",
  "Sogamoso", "Soledad", "Tocancipá", "Tuluá", "Tumaco", "Tunja", "Turbaco",
  "Turbo", "Valledupar", "Villavicencio", "Yopal", "Yumbo", "Zipaquirá",
];

const ROL_LABELS: Record<string, string> = {
  cliente: "Cliente",
  admin: "Administrador",
  supervisor: "Supervisor",
};

function iniciales(firstName: string, lastName: string, email: string) {
  if (firstName) return (firstName[0] + (lastName?.[0] ?? "")).toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatMesAno(iso: string) {
  const fecha = new Date(iso);
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

type FormState = { first_name: string; last_name: string; telefono: string; ciudad: string };

const toForm = (p: UserProfile): FormState => ({
  first_name: p.first_name,
  last_name: p.last_name,
  telefono: p.telefono,
  ciudad: p.ciudad,
});

// Recibe el perfil ya cargado por el Server Component padre (perfil/page.tsx)
// — solo maneja el estado interactivo de edición, no vuelve a pedir los
// datos iniciales.
export default function PerfilForm({ initialProfile }: { initialProfile: UserProfile }) {
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(toForm(initialProfile));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCancel = () => {
    setForm(toForm(profile));
    setErrors([]);
    setEditing(false);
  };

  const liveErrors = {
    first_name: nombreError(form.first_name),
    last_name: nombreError(form.last_name),
    telefono: telefonoError(form.telefono),
  };
  const hasLiveErrors = Object.values(liveErrors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const updated = await apiClientFetch<UserProfile>("/api/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setForm(toForm(updated));
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const body = err.body as { errors?: string[]; detail?: string };
        setErrors(body?.errors ?? [body?.detail ?? err.message]);
      } else {
        setErrors(["No se pudo actualizar el perfil"]);
      }
    } finally {
      setSaving(false);
    }
  };

  const sigla = iniciales(profile.first_name, profile.last_name, profile.email);
  const nombreCompleto = `${profile.first_name} ${profile.last_name}`.trim() || profile.email;

  return (
    <main className="container mx-auto flex-1 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-slate-800">
              <div className="bg-linear-to-br from-blue-600 to-blue-800 p-8 text-center text-white">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-bold text-blue-700 shadow-xl">
                  {sigla}
                </div>
                <h2 className="mb-1 text-2xl font-bold">{nombreCompleto}</h2>
                <p className="text-sm text-blue-100">{profile.email}</p>
              </div>

              <div className="p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-700 dark:text-slate-300">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Pedidos realizados</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{profile.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Total gastado</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatPrecio(profile.total_spent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Miembro desde</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{formatMesAno(profile.fecha_registro)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                  <i className="fas fa-user-circle mr-2" />
                  Información Personal
                </h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white transition hover:bg-yellow-600"
                  >
                    <i className="fas fa-edit mr-2" />
                    Editar
                  </button>
                )}
              </div>

              {errors.length > 0 && (
                <div className="mb-6 space-y-1">
                  {errors.map((msg) => (
                    <p key={msg} className="text-sm font-medium text-red-600 dark:text-red-400">
                      {msg}
                    </p>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                      <i className="fas fa-user mr-2 text-blue-600 dark:text-blue-400" />
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={handleChange("first_name")}
                      disabled={!editing}
                      placeholder="Ej: Juan"
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
                    />
                    {liveErrors.first_name && (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{liveErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                      <i className="fas fa-user mr-2 text-blue-600 dark:text-blue-400" />
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={handleChange("last_name")}
                      disabled={!editing}
                      placeholder="Ej: Pérez"
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
                    />
                    {liveErrors.last_name && (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{liveErrors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    <i className="fas fa-envelope mr-2 text-blue-600 dark:text-blue-400" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border-2 border-gray-300 bg-gray-100 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    <i className="fas fa-info-circle mr-1" />
                    El correo electrónico no se puede cambiar
                  </p>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    <i className="fas fa-phone mr-2 text-blue-600 dark:text-blue-400" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={handleChange("telefono")}
                    disabled={!editing}
                    placeholder="3001234567"
                    maxLength={10}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
                  />
                  {liveErrors.telefono ? (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{liveErrors.telefono}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      <i className="fas fa-info-circle mr-1" />
                      Ingresa 10 dígitos sin espacios ni guiones
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    <i className="fas fa-map-marker-alt mr-2 text-blue-600 dark:text-blue-400" />
                    Ciudad *
                  </label>
                  <select
                    value={form.ciudad}
                    onChange={handleChange("ciudad")}
                    disabled={!editing}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
                  >
                    <option value="">Selecciona tu ciudad</option>
                    {CIUDADES.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    <i className="fas fa-shield-alt mr-2 text-blue-600 dark:text-blue-400" />
                    Rol
                  </label>
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-500/10">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      {ROL_LABELS[profile.tipo_usuario] ?? profile.tipo_usuario}
                    </span>
                  </div>
                </div>

                {editing && (
                  <div className="mt-8 flex gap-4">
                    <button
                      type="submit"
                      disabled={saving || hasLiveErrors}
                      className="flex-1 rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      <i className="fas fa-save mr-2" />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-gray-500 py-3 font-bold text-white transition hover:bg-gray-600 disabled:opacity-50"
                    >
                      <i className="fas fa-times mr-2" />
                      Cancelar
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="block w-full rounded-lg bg-red-600 py-3 text-center font-bold text-white transition hover:bg-red-700"
                >
                  <i className="fas fa-sign-out-alt mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
