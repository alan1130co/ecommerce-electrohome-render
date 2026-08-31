import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { adminApiGetSafe } from "@/lib/api-admin";
import type { AdminMe } from "@/lib/dashboard-types";

// Guard de servidor para TODO /dashboard/* excepto /dashboard/login (que
// vive fuera de este route group). Se reenvía la cookie de sesión del
// navegador a Django (ver lib/api-admin.ts) y se corta acá mismo, antes de
// renderizar cualquier página protegida — un cliente autenticado como
// cliente jamás llega a ver el HTML del panel, ni por un instante.
export default async function DashboardProtectedLayout({ children }: { children: ReactNode }) {
  const result = await adminApiGetSafe<AdminMe>("/api/dashboard/auth/me/");

  if (!result.ok || !result.data.is_admin) {
    redirect("/dashboard/login");
  }

  return <DashboardShell user={result.data}>{children}</DashboardShell>;
}
