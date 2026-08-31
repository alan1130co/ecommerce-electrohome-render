"use client";

import Link from "next/link";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";

interface RegisterForm {
  email: string;
  first_name: string;
  last_name: string;
  telefono: string;
  password1: string;
  password2: string;
}

const EMPTY: RegisterForm = {
  email: "",
  first_name: "",
  last_name: "",
  telefono: "",
  password1: "",
  password2: "",
};

export default function RegistroPage() {
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const handleChange =
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await apiClientFetch<{ detail: string }>("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone(res.detail);
    } catch (err) {
      const body = err instanceof ApiClientError ? (err.body as { errors?: Record<string, string[]> }) : null;
      if (body?.errors) {
        setErrors(body.errors);
      } else {
        setErrors({ __general__: [err instanceof Error ? err.message : "No se pudo completar el registro"] });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">¡Ya casi!</h1>
        <p className="mt-2 text-gray-600">{done}</p>
        <Link href="/cuenta/login" className="mt-6 inline-block text-blue-700 hover:underline">
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.__general__ && (
          <p className="text-sm font-medium text-red-500">{errors.__general__[0]}</p>
        )}

        <RegField
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          errors={errors.email}
          required
        />
        <RegField
          label="Nombre"
          value={form.first_name}
          onChange={handleChange("first_name")}
          errors={errors.first_name}
          required
        />
        <RegField
          label="Apellido"
          value={form.last_name}
          onChange={handleChange("last_name")}
          errors={errors.last_name}
          required
        />
        <RegField
          label="Teléfono (opcional)"
          value={form.telefono}
          onChange={handleChange("telefono")}
          errors={errors.telefono}
        />
        <RegField
          label="Contraseña"
          type="password"
          value={form.password1}
          onChange={handleChange("password1")}
          errors={errors.password1}
          required
        />
        <RegField
          label="Confirmar contraseña"
          type="password"
          value={form.password2}
          onChange={handleChange("password2")}
          errors={errors.password2}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/login" className="font-medium text-blue-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}

function RegField({
  label,
  errors,
  ...props
}: { label: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = `reg-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {errors?.map((msg) => (
        <p key={msg} className="mt-1 text-xs text-red-500">
          {msg}
        </p>
      ))}
    </div>
  );
}
