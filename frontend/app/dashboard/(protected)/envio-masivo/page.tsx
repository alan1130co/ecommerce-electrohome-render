import EnvioMasivoForm from "@/components/dashboard/EnvioMasivoForm";
import { adminApiGet } from "@/lib/api-admin";
import type { UsuarioAdmin } from "@/lib/dashboard-types";

export default async function EnvioMasivoPage() {
  const usuarios = await adminApiGet<UsuarioAdmin[]>("/api/dashboard/envio-masivo/");

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-envelope text-amber-500" /> Envío Masivo
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Envía correos promocionales a tus clientes</p>
      </div>
      <EnvioMasivoForm usuarios={usuarios} />
    </div>
  );
}
