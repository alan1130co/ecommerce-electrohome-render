"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import ChatWidget from "@/components/chatbot/ChatWidget";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

/**
 * El panel /dashboard tiene su propio chrome (sidebar de admin, sin
 * navbar/footer/chat de la tienda) — en vez de duplicar el root layout con
 * "multiple root layouts" de Next.js (que obliga a mover TODAS las rutas
 * existentes del storefront a un route group), se oculta el chrome público
 * acá según el pathname. Es la opción de menor riesgo: cero archivos del
 * storefront se mueven de lugar.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ChatWidget />
    </>
  );
}
