"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import type { UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();

  const [form, setForm] = useState({ first_name: "", last_name: "", telefono: "", ciudad: "" });
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/cuenta/perfil/editar");
    }
  }, [checked, user, router]);

  useEffect(() => {
    if (!user) return;
    apiClientFetch<UserProfile>("/api/auth/profile/").then((p) => {
      setForm({
        first_name: p.first_name,
        last_name: p.last_name,
        telefono: p.telefono,
        ciudad: p.ciudad,
      });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      await apiClientFetch("/api/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      router.push("/cuenta/perfil");
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

  if (!checked || !user || !loaded) {
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center text-gray-500">
        Cargando...
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.map((msg) => (
          <p key={msg} className="text-sm font-medium text-red-500">
            {msg}
          </p>
        ))}

        <EditField label="Nombre" value={form.first_name} onChange={handleChange("first_name")} />
        <EditField label="Apellido" value={form.last_name} onChange={handleChange("last_name")} />
        <EditField
          label="Teléfono"
          value={form.telefono}
          onChange={handleChange("telefono")}
        />
        <EditField label="Ciudad" value={form.ciudad} onChange={handleChange("ciudad")} />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}

function EditField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `edit-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
