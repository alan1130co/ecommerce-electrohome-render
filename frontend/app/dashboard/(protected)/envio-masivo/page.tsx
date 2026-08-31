import EnvioMasivoForm from "@/components/dashboard/EnvioMasivoForm";
import { adminApiGet } from "@/lib/api-admin";
import type { UsuarioAdmin } from "@/lib/dashboard-types";

export default async function EnvioMasivoPage() {
  const usuarios = await adminApiGet<UsuarioAdmin[]>("/api/dashboard/envio-masivo/");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Envío masivo de correos</h1>
      <EnvioMasivoForm usuarios={usuarios} />
    </div>
  );
}
