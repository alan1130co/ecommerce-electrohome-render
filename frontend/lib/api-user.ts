import { cookies } from "next/headers";

// Igual que lib/api-admin.ts pero para páginas del storefront con sesión
// de cliente (carrito, pedidos, perfil, wishlist) — reenvía la cookie al
// backend desde el Server Component, sin cache (datos privados que
// cambian con cada acción del usuario).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class UserApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "UserApiError";
    this.status = status;
  }
}

async function fetchWithCookies(path: string): Promise<Response> {
  const cookieStore = await cookies();
  return fetch(`${API_URL}${path}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
}

export async function userApiGet<T>(path: string): Promise<T> {
  const res = await fetchWithCookies(path);
  if (!res.ok) {
    throw new UserApiError(res.status, `Error ${res.status} al consultar ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Igual que userApiGet, pero nunca lanza en 401/403 — para decidir si
 * redirige a /cuenta/login sin tirar un error. */
export async function userApiGetSafe<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetchWithCookies(path);
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}
