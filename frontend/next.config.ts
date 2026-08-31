import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Django (APPEND_SLASH) exige slash final en todas sus rutas. Sin esto,
  // Next quita el slash de /api/csrf/ → /api/csrf antes de aplicar el
  // rewrite, Django lo vuelve a agregar con su propio redirect, y entre
  // los dos arman un loop infinito (ERR_TOO_MANY_REDIRECTS). Con
  // trailingSlash:true, Next usa la misma convención en todas sus rutas.
  trailingSlash: true,
  // Este repo también tiene un package.json en la raíz (para el build
  // de Tailwind del proyecto Django, no relacionado con Next.js) —
  // fijamos la raíz explícitamente para que Turbopack no la confunda.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Los productos traen imagen_principal de 3 fuentes reales distintas
    // (datos importados, no solo Cloudinary) — confirmadas contra la API:
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "www.tiendavitalica.com" },
    ],
  },
  // Reenvía /api/* a Django del lado del servidor de Next. El navegador
  // solo habla con este mismo origen (localhost:3000) — sin esto, cada
  // fetch desde un Client Component (carrito, etc.) sería cross-origin
  // de verdad y necesitaría CORS + cookies SameSite=None/Secure, que es
  // justo lo que la decisión de "mismo dominio" busca evitar. En
  // producción, Vercel Services hace este mismo mapeo a nivel de
  // dominio; esto es la réplica local.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
    return [
      {
        // :path* no conserva el slash final al interpolarse en destination,
        // así que se agrega explícito — todas las rutas DRF lo exigen
        // (APPEND_SLASH de Django) y ninguna lo rechaza.
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*/`,
      },
      {
        // El chatbot ya tenía su propio endpoint JSON en Django
        // (/chatbot/api/message/) antes de esta migración — se reutiliza
        // tal cual, sin duplicarlo bajo /api/.
        source: "/chatbot/:path*",
        destination: `${apiUrl}/chatbot/:path*/`,
      },
    ];
  },
};

export default nextConfig;
