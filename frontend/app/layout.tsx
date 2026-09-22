import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";

import SiteChrome from "@/components/layout/SiteChrome";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "ElectroHome - Calidad y ahorro en un solo click",
  description: "ElectroHome - Tu tienda de electrodomésticos online con las mejores ofertas",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cookie (no localStorage) para que el tema correcto ya esté en el HTML
  // que manda el servidor — evita el flash de contenido sin estilo que
  // se ve si el tema se aplica recién cuando el JS del cliente lo detecta.
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isValidTheme(themeCookie) ? themeCookie : "light";

  return (
    <html lang="es" className={`h-full antialiased ${theme === "dark" ? "dark" : ""}`}>
      <head>
        <link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css" />
      </head>
      <body
        className="flex min-h-full flex-col"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
