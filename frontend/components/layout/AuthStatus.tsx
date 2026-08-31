"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

export default function AuthStatus() {
  const { user, checked, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (!checked) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/cuenta/perfil" className="hidden hover:text-amber-300 sm:inline">
          {user.first_name || user.email}
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-md border border-white/40 px-3 py-1.5 font-semibold hover:bg-white/10"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/cuenta/login"
      className="rounded-md bg-amber-500 px-3 py-1.5 font-semibold text-white hover:bg-amber-600"
    >
      Ingresar
    </Link>
  );
}
