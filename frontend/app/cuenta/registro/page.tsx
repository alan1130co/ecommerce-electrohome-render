"use client";

import Link from "next/link";
import { useState } from "react";

import { apiClientFetch, ApiClientError } from "@/lib/api-client";
import { emailFormatError, nombreError, telefonoError } from "@/lib/validation";

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

// Mismas 4 reglas que RegisterForm.clean_password1 en el backend — se
// muestran en vivo acá, pero la validación real sigue corriendo en el
// servidor al enviar el formulario.
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Al menos una letra mayúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Al menos un número (0-9)", test: (p) => /\d/.test(p) },
  { label: "Al menos un carácter especial (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/.test(p) },
];

const STRENGTH_LABELS = ["-", "Débil", "Regular", "Buena", "Fuerte"];
const STRENGTH_COLORS = ["bg-gray-200", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];

export default function RegistroPage() {
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleChange =
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const passedRules = PASSWORD_RULES.map((rule) => rule.test(form.password1));
  const strength = form.password1 ? passedRules.filter(Boolean).length : 0;

  const liveErrors = {
    first_name: nombreError(form.first_name),
    last_name: nombreError(form.last_name),
    email: emailFormatError(form.email),
    telefono: telefonoError(form.telefono),
  };
  const hasLiveErrors = Object.values(liveErrors).some(Boolean);

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
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-slate-100">¡Ya casi!</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">{done}</p>
        <Link href="/cuenta/login" className="mt-6 inline-block text-blue-700 hover:underline dark:text-blue-400">
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-slate-800">
        <div className="bg-linear-to-br from-blue-600 to-blue-800 px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <i className="fas fa-user-plus text-3xl text-blue-700" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Crear Cuenta</h1>
          <p className="mt-1 text-sm text-blue-100">Únete a ElectroHome y disfruta de grandes ofertas</p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.__general__ && (
              <p className="text-sm font-medium text-red-500 dark:text-red-400">{errors.__general__[0]}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <RegField
                label="Nombre"
                icon="fa-user"
                placeholder="Ingresa tu nombre"
                value={form.first_name}
                onChange={handleChange("first_name")}
                errors={liveErrors.first_name ? [liveErrors.first_name] : errors.first_name}
                required
              />
              <RegField
                label="Apellido"
                icon="fa-user"
                placeholder="Ingresa tu apellido"
                value={form.last_name}
                onChange={handleChange("last_name")}
                errors={liveErrors.last_name ? [liveErrors.last_name] : errors.last_name}
                required
              />
            </div>

            <RegField
              label="Correo Electrónico"
              icon="fa-envelope"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange("email")}
              errors={liveErrors.email ? [liveErrors.email] : errors.email}
              required
            />

            <div>
              <RegField
                label="Teléfono"
                icon="fa-phone"
                placeholder="3001234567"
                value={form.telefono}
                onChange={handleChange("telefono")}
                errors={liveErrors.telefono ? [liveErrors.telefono] : errors.telefono}
                maxLength={10}
              />
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                <i className="fas fa-info-circle" /> Debe contener exactamente 10 dígitos
              </p>
            </div>

            <div>
              <label htmlFor="password1" className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-300">
                <i className="fas fa-lock text-blue-700 dark:text-blue-400" /> Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password1"
                  type={showPassword1 ? "text" : "password"}
                  required
                  placeholder="Crea una contraseña segura"
                  value={form.password1}
                  onChange={handleChange("password1")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword1((s) => !s)}
                  aria-label={showPassword1 ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <i className={`fas ${showPassword1 ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
              {errors.password1?.map((msg) => (
                <p key={msg} className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {msg}
                </p>
              ))}

              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>Fuerza de contraseña:</span>
                <span>{STRENGTH_LABELS[strength]}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                <div
                  className={`h-full transition-all ${STRENGTH_COLORS[strength]}`}
                  style={{ width: `${(strength / PASSWORD_RULES.length) * 100}%` }}
                />
              </div>

              <div className="mt-3 rounded-md bg-blue-50 p-3 dark:bg-blue-500/10">
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                  <i className="fas fa-shield-alt" /> Requisitos de contraseña:
                </p>
                <ul className="space-y-1 text-sm">
                  {PASSWORD_RULES.map((rule, i) => (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-2 ${passedRules[i] ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-slate-500"}`}
                    >
                      <i className={passedRules[i] ? "fas fa-check-circle" : "fas fa-circle text-[6px]"} />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="password2" className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-300">
                <i className="fas fa-lock text-blue-700 dark:text-blue-400" /> Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password2"
                  type={showPassword2 ? "text" : "password"}
                  required
                  placeholder="Confirma tu contraseña"
                  value={form.password2}
                  onChange={handleChange("password2")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2((s) => !s)}
                  aria-label={showPassword2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <i className={`fas ${showPassword2 ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
              {errors.password2?.map((msg) => (
                <p key={msg} className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {msg}
                </p>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || hasLiveErrors}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              <i className="fas fa-user-plus" /> {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <div className="my-5 border-t border-gray-200 dark:border-slate-700" />

          <p className="text-center text-sm text-gray-600 dark:text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/cuenta/login" className="font-bold text-blue-700 hover:underline dark:text-blue-400">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function RegField({
  label,
  icon,
  errors,
  ...props
}: { label: string; icon: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = `reg-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-300">
        <i className={`fas ${icon} text-blue-700 dark:text-blue-400`} /> {label}{" "}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        {...props}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {errors?.map((msg) => (
        <p key={msg} className="mt-1 text-xs text-red-500 dark:text-red-400">
          {msg}
        </p>
      ))}
    </div>
  );
}
