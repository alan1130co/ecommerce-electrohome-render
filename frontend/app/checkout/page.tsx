"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PedidoConfirmacion from "@/components/order/PedidoConfirmacion";
import { apiClientFetch } from "@/lib/api-client";
import { formatPrecio } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";
import { emailFormatError, telefonoError } from "@/lib/validation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

interface CheckoutForm {
  email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string;
  notes: string;
}

const EMPTY_FORM: CheckoutForm = {
  email: "",
  phone: "",
  shipping_address: "",
  shipping_city: "",
  shipping_department: "",
  shipping_postal_code: "",
  notes: "",
};

function Breadcrumb() {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
      <Link href="/" className="hover:text-blue-700 hover:underline dark:hover:text-blue-400">
        Inicio
      </Link>
      <i className="fas fa-chevron-right text-xs text-gray-400 dark:text-slate-600" />
      <Link href="/carrito" className="hover:text-blue-700 hover:underline dark:hover:text-blue-400">
        Carrito
      </Link>
      <i className="fas fa-chevron-right text-xs text-gray-400 dark:text-slate-600" />
      <span className="font-medium text-blue-700 dark:text-blue-400">Checkout</span>
    </nav>
  );
}

function CardHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-800 dark:text-blue-300">
      <i className={icon} /> {title}
    </h2>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();
  const { summary, loading: cartLoading, fetchCart } = useCartStore();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [envioCosto, setEnvioCosto] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
    fetchCart();
  }, [fetchMe, fetchCart]);

  useEffect(() => {
    apiClientFetch<string[]>("/api/ubicaciones/departamentos/")
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
  }, []);

  // El select de ciudad depende del departamento elegido — se limpia la
  // ciudad al cambiar de departamento porque la lista anterior ya no aplica.
  useEffect(() => {
    if (!form.shipping_department) {
      setCiudades([]);
      return;
    }
    let cancelled = false;
    apiClientFetch<string[]>(
      `/api/ubicaciones/ciudades/?departamento=${encodeURIComponent(form.shipping_department)}`,
    )
      .then((data) => {
        if (!cancelled) setCiudades(data);
      })
      .catch(() => {
        if (!cancelled) setCiudades([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.shipping_department]);

  // Envío en vivo: mismo cálculo que corre al confirmar el pedido
  // (OrderService._calculate_shipping), para que el cliente vea el costo
  // real antes de pagar en vez de después.
  useEffect(() => {
    if (!form.shipping_city) {
      setEnvioCosto(null);
      return;
    }
    let cancelled = false;
    apiClientFetch<{ shipping_cost: string }>(
      `/api/checkout/calcular-envio/?ciudad=${encodeURIComponent(form.shipping_city)}`,
    )
      .then((data) => {
        if (!cancelled) setEnvioCosto(data.shipping_cost);
      })
      .catch(() => {
        if (!cancelled) setEnvioCosto(null);
      });
    return () => {
      cancelled = true;
    };
  }, [form.shipping_city]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/checkout");
    }
  }, [checked, user, router]);

  // Precarga el email de la cuenta — el campo queda editable por si el
  // cliente quiere recibir la confirmación en otra dirección.
  useEffect(() => {
    if (user?.email) {
      setForm((f) => (f.email ? f : { ...f, email: user.email }));
    }
  }, [user]);

  const handleChange =
    (field: keyof CheckoutForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const liveErrors = {
    email: emailFormatError(form.email),
    phone: telefonoError(form.phone),
  };
  const hasLiveErrors = Object.values(liveErrors).some(Boolean);

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({ ...f, shipping_department: e.target.value, shipping_city: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiClientFetch<Order>("/api/checkout/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setOrder(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo confirmar el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (!checked || !user) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center text-gray-500 dark:text-slate-400">
        Verificando sesión...
      </main>
    );
  }

  if (order) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Breadcrumb />
        <PedidoConfirmacion order={order} />
      </main>
    );
  }

  if (cartLoading && !summary) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center text-gray-500 dark:text-slate-400">
        Cargando...
      </main>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Breadcrumb />
        <div className="rounded-lg bg-white p-16 text-center shadow-md dark:bg-slate-800">
          <i className="fas fa-shopping-cart text-8xl text-gray-300 dark:text-slate-600" />
          <p className="mt-6 text-xl font-bold text-gray-800 dark:text-slate-100">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Agrega productos antes de finalizar la compra.</p>
          <Link
            href="/productos"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            <i className="fas fa-shopping-bag" /> Ver Productos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Breadcrumb />
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-blue-800 dark:text-blue-300">
        <i className="fas fa-credit-card" /> Finalizar Compra
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-500 dark:bg-red-500/10 dark:text-red-400">{error}</p>
          )}

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
            <CardHeader icon="fas fa-user" title="Información de Contacto" />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                error={liveErrors.email}
                required
              />
              <Field
                label="Teléfono"
                placeholder="3001234567"
                value={form.phone}
                onChange={handleChange("phone")}
                error={liveErrors.phone}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
            <CardHeader icon="fas fa-map-marker-alt" title="Dirección de Envío" />
            <div className="space-y-4">
              <Field
                label="Dirección Completa"
                placeholder="Calle 123 #45-67, Apto 890"
                value={form.shipping_address}
                onChange={handleChange("shipping_address")}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shipping_department" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="shipping_department"
                    value={form.shipping_department}
                    onChange={handleDepartamentoChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Seleccione un departamento</option>
                    {departamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="shipping_city" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Ciudad/Municipio <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="shipping_city"
                    value={form.shipping_city}
                    onChange={handleChange("shipping_city")}
                    required
                    disabled={!form.shipping_department}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                  >
                    <option value="">
                      {form.shipping_department ? "Seleccione una ciudad" : "Primero seleccione un departamento"}
                    </option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Field
                label="Código postal (opcional)"
                value={form.shipping_postal_code}
                onChange={handleChange("shipping_postal_code")}
              />
              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={handleChange("notes")}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
            <CardHeader icon="fas fa-wallet" title="Método de Pago" />

            <div className="mb-4 flex items-start gap-2 rounded-md border-l-4 border-blue-400 bg-blue-50 p-3 text-sm dark:border-blue-500 dark:bg-blue-500/10">
              <i className="fas fa-info-circle mt-0.5 text-blue-600 dark:text-blue-400" />
              <p>
                <span className="font-semibold text-blue-800 dark:text-blue-300">Por el momento solo aceptamos:</span>{" "}
                <span className="text-blue-700 dark:text-blue-400">
                  <i className="fas fa-money-bill-wave" /> Pago en efectivo al momento de la entrega
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-default items-center gap-3 rounded-lg border-2 border-green-400 bg-green-50 p-4 dark:border-green-600 dark:bg-green-500/10">
                <input type="radio" checked readOnly className="h-4 w-4 accent-blue-600" />
                <i className="fas fa-money-bill-wave text-xl text-green-600 dark:text-green-400" />
                <span>
                  <span className="block font-semibold text-gray-800 dark:text-slate-100">Efectivo Contraentrega</span>
                  <span className="block text-sm text-green-700 dark:text-green-400">
                    Paga en efectivo cuando recibas tu pedido
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-70 dark:border-slate-700 dark:bg-slate-900">
                <input type="radio" disabled className="h-4 w-4" />
                <i className="fas fa-credit-card text-xl text-gray-400 dark:text-slate-600" />
                <span>
                  <span className="block font-semibold text-gray-400 dark:text-slate-500">Tarjeta de Crédito/Débito</span>
                  <span className="block text-sm text-gray-400 dark:text-slate-600">
                    <i className="fas fa-clock" /> Próximamente disponible
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-70 dark:border-slate-700 dark:bg-slate-900">
                <input type="radio" disabled className="h-4 w-4" />
                <i className="fas fa-university text-xl text-gray-400 dark:text-slate-600" />
                <span>
                  <span className="block font-semibold text-gray-400 dark:text-slate-500">PSE</span>
                  <span className="block text-sm text-gray-400 dark:text-slate-600">
                    <i className="fas fa-clock" /> Próximamente disponible
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-500/10">
              <p className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400">
                <i className="fas fa-receipt" /> Instrucciones de pago:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-500">
                <li>Prepara el monto exacto en efectivo</li>
                <li>El pago se realiza al recibir tu pedido</li>
                <li>Recibirás un comprobante de entrega</li>
                <li>Revisa tu pedido antes de pagar</li>
              </ul>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-lg bg-white p-6 shadow-md lg:col-span-1 dark:bg-slate-800">
          <h2 className="mb-4 text-xl font-bold text-blue-800 dark:text-blue-300">Resumen del Pedido</h2>

          <ul className="space-y-3">
            {summary.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-slate-200">
                  {item.producto.imagen_principal && (
                    <Image
                      src={item.producto.imagen_principal}
                      alt={item.producto.nombre}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-slate-200">
                    {item.producto.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Cantidad: {item.quantity}</p>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{formatPrecio(item.subtotal)}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-gray-200 dark:border-slate-700" />

          <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrecio(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span>{formatPrecio(summary.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío:</span>
              {envioCosto != null ? (
                <span className="font-medium text-gray-800 dark:text-slate-200">{formatPrecio(envioCosto)}</span>
              ) : (
                <span className="text-gray-500 dark:text-slate-400">Se calcula según tu ciudad</span>
              )}
            </div>
          </div>

          <div className="my-3 border-t border-gray-200 dark:border-slate-700" />

          <div className="flex justify-between text-lg font-bold text-blue-700 dark:text-blue-400">
            <span>Total:</span>
            <span>
              {formatPrecio(Number(summary.subtotal) + Number(summary.tax) + Number(envioCosto ?? 0))}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || hasLiveErrors}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            <i className="fas fa-check-circle" /> {submitting ? "Confirmando..." : "Confirmar Pedido"}
          </button>
          <Link
            href="/carrito"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            <i className="fas fa-arrow-left" /> Volver al Carrito
          </Link>

          <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-gray-500 dark:text-slate-400">
            <i className="fas fa-lock" /> Pago 100% seguro y protegido
          </p>
        </aside>
      </form>
    </main>
  );
}

function Field({
  label,
  id,
  error,
  ...props
}: { label: string; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        {...props}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {error && <p className="mt-1 text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
