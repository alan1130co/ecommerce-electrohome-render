"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const formatPrecio = (precio: string | number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));

interface CheckoutForm {
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string;
  notes: string;
}

const EMPTY_FORM: CheckoutForm = {
  phone: "",
  shipping_address: "",
  shipping_city: "",
  shipping_department: "",
  shipping_postal_code: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();
  const { summary, loading: cartLoading, fetchCart } = useCartStore();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchMe();
    fetchCart();
  }, [fetchMe, fetchCart]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/checkout");
    }
  }, [checked, user, router]);

  const handleChange =
    (field: keyof CheckoutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
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
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center text-gray-500">
        Verificando sesión...
      </main>
    );
  }

  if (order) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">¡Pedido confirmado!</h1>
        <p className="mt-2 text-gray-600">
          Pedido <span className="font-semibold">#{order.order_number}</span> — pagas{" "}
          <strong>contraentrega</strong> al recibirlo.
        </p>
        <p className="mt-1 text-xl font-bold text-blue-700">{formatPrecio(order.total)}</p>
        <p className="mt-4 text-sm text-gray-500">
          Te enviamos la confirmación a <strong>{order.email}</strong>.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
        >
          Seguir comprando
        </Link>
      </main>
    );
  }

  if (cartLoading && !summary) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando...
      </main>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
        <p className="text-gray-500">Tu carrito está vacío.</p>
        <Link
          href="/productos"
          className="mt-4 inline-block rounded bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-3">
      <form onSubmit={handleSubmit} className="space-y-4 md:col-span-2">
        <h1 className="text-2xl font-bold text-gray-900">Finalizar compra</h1>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          💵 Único método disponible por ahora: <strong>pago contraentrega</strong> — pagas en
          efectivo cuando recibas tu pedido.
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <Field
          label="Teléfono (10 dígitos)"
          value={form.phone}
          onChange={handleChange("phone")}
          required
        />
        <Field
          label="Dirección de envío"
          value={form.shipping_address}
          onChange={handleChange("shipping_address")}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Ciudad"
            value={form.shipping_city}
            onChange={handleChange("shipping_city")}
            required
          />
          <Field
            label="Departamento"
            value={form.shipping_department}
            onChange={handleChange("shipping_department")}
            required
          />
        </div>
        <Field
          label="Código postal (opcional)"
          value={form.shipping_postal_code}
          onChange={handleChange("shipping_postal_code")}
        />
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={handleChange("notes")}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {submitting ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-bold text-gray-800">Resumen</h2>
        <ul className="space-y-2 text-sm">
          {summary.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-gray-700">
                {item.producto.nombre} x{item.quantity}
              </span>
              <span className="shrink-0 font-medium">{formatPrecio(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrecio(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (19%)</span>
            <span>{formatPrecio(summary.tax)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Envío</span>
            <span>Se calcula según tu ciudad</span>
          </div>
        </div>
      </aside>
    </main>
  );
}

function Field({
  label,
  id,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
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
    </div>
  );
}
