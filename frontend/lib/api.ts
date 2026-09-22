const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Fetch de solo lectura contra la API de Django (DRF), pensado para
 * Server Components. Corre en el servidor de Next.js, no en el
 * navegador, así que no necesita CORS.
 */
export async function apiGet<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Error ${res.status} al consultar ${path}`);
  }

  return res.json() as Promise<T>;
}

/** Igual que apiGet, pero devuelve null en 404 en vez de lanzar — para notFound(). */
export async function apiGetOptional<T>(
  path: string,
  revalidateSeconds = 60,
): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ApiError(res.status, `Error ${res.status} al consultar ${path}`);
  }

  return res.json() as Promise<T>;
}
