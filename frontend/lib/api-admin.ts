import { cookies } from "next/headers";

// Fetch de solo lectura para Server Components de /dashboard. A diferencia
// de lib/api.ts (público, sin cookies, con cache — pensado para catálogo
// anónimo) esto reenvía la cookie de sesión del navegador a Django para que
// /api/dashboard/* responda con los datos del supervisor logueado. Sin
// cache (no-store): son datos privados que cambian con cada acción del
// panel, nunca deben quedar en el cache compartido de Next.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
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

export async function adminApiGet<T>(path: string): Promise<T> {
  const res = await fetchWithCookies(path);
  if (!res.ok) {
    throw new AdminApiError(res.status, `Error ${res.status} al consultar ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Igual que adminApiGet, pero nunca lanza en 401/403 — la usa el layout
 * protegido para decidir si redirige a /dashboard/login sin tirar un error. */
export async function adminApiGetSafe<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetchWithCookies(path);
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}
