"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClientFetch } from "@/lib/api-client";
import { formatPrecio } from "@/lib/orderStatus";
import type { UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function PerfilPage() {
  const router = useRouter();
  const { user, checked, fetchMe } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (checked && !user) {
      router.push("/cuenta/login?next=/cuenta/perfil");
    }
  }, [checked, user, router]);

  useEffect(() => {
    if (!user) return;
    apiClientFetch<UserProfile>("/api/auth/profile/").then(setProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!checked || !user || !profile) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center text-gray-500">
        Cargando...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <Link
          href="/cuenta/perfil/editar"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Editar perfil
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Datos personales
          </h2>
          <p className="text-sm text-gray-700">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-sm text-gray-700">{profile.email}</p>
          {profile.telefono && <p className="text-sm text-gray-700">Tel: {profile.telefono}</p>}
          {profile.ciudad && <p className="text-sm text-gray-700">{profile.ciudad}</p>}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Actividad
          </h2>
          <p className="text-sm text-gray-700">Pedidos realizados: {profile.total_orders}</p>
          <p className="text-sm text-gray-700">Total comprado: {formatPrecio(profile.total_spent)}</p>
          <Link href="/pedidos" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
            Ver mis pedidos →
          </Link>
        </div>
      </div>
    </main>
  );
}
