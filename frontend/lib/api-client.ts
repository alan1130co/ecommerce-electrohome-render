// Cliente de fetch para Client Components (navegador). A diferencia de
// lib/api.ts (Server Components, fetch directo a NEXT_PUBLIC_API_URL),
// este usa rutas RELATIVAS — el navegador solo habla con el propio
// origen de Next.js, que reenvía /api/* a Django (ver rewrites en
// next.config.ts). Así evitamos CORS y cookies cross-site por completo.

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (getCookie("csrftoken")) return;
  await fetch("/api/csrf/", { credentials: "include" });
}

export class ApiClientError extends Error {
  status: number;
  /** Body completo de la respuesta de error (ej. { errors: {...} } de un form). */
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

export async function apiClientFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isUnsafe = UNSAFE_METHODS.has(method);

  if (isUnsafe) {
    await ensureCsrfCookie();
  }

  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);
  // Con FormData (subida de archivos) NO se fija Content-Type — el
  // navegador debe poner el boundary multipart correcto él solo.
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (isUnsafe) {
    const token = getCookie("csrftoken");
    if (token) headers.set("X-CSRFToken", token);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { detail?: string });
    throw new ApiClientError(res.status, body.detail ?? `Error ${res.status}`, body);
  }

  return res.json() as Promise<T>;
}
