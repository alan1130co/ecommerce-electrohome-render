"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/store/authStore";

function iniciales(firstName: string, lastName: string, email: string) {
  if (firstName) return (firstName[0] + (lastName?.[0] ?? "")).toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

export default function AuthStatus() {
  const { user, checked, fetchMe, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!checked) return null;

  if (user) {
    const nombre = user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.email;
    const sigla = iniciales(user.first_name, user.last_name, user.email);

    return (
      <div className="relative" ref={ref}>
        <button
          id="user-menu-btn"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú usuario"
          className="flex items-center justify-center"
        >
          {sigla}
        </button>
        {open && (
          <div id="user-dropdown" className="absolute right-0 z-50 mt-3" style={{ width: 270 }}>
            <div className="dropdown-header">
              <div className="flex items-center gap-3">
                <div className="dropdown-avatar">{sigla}</div>
                <div>
                  <div className="dropdown-name">{nombre}</div>
                  <div className="dropdown-badge">
                    <i className="fas fa-user-check" style={{ fontSize: ".6rem" }} /> Cliente
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Link href="/cuenta/perfil" className="dropdown-item" onClick={() => setOpen(false)}>
                <span className="item-icon"><i className="fas fa-user" /></span>
                <span>Mi Perfil</span>
              </Link>
              <Link href="/pedidos" className="dropdown-item" onClick={() => setOpen(false)}>
                <span className="item-icon"><i className="fas fa-shopping-bag" /></span>
                <span>Mis Pedidos</span>
              </Link>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item logout w-full text-left"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                <span className="item-icon"><i className="fas fa-sign-out-alt" /></span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Link href="/cuenta/login" className="btn-ingresar border border-white/40 text-white hover:bg-blue-700">
        <i className="fas fa-sign-in-alt" /> Ingresar
      </Link>
      <Link href="/cuenta/registro" className="btn-registrarse text-white">
        <i className="fas fa-user-plus" /> Registrarse
      </Link>
    </>
  );
}
