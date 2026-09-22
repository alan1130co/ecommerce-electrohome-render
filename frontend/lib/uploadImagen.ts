import { apiClientFetch } from "./api-client";

/** Sube un archivo a /api/dashboard/upload-imagen/ (Cloudinary vía
 * default_storage en Django) y devuelve la URL resultante. Compartido por
 * ProductoForm y BannerForm — ambos necesitan "subir ahora, guardar la URL
 * después" por el mismo motivo (ver comentario en dashboard/api_views.py). */
export async function subirImagen(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { url } = await apiClientFetch<{ url: string }>("/api/dashboard/upload-imagen/", {
    method: "POST",
    body: formData,
  });
  return url;
}
