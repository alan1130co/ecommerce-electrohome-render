import { redirect } from "next/navigation";

import PerfilForm from "@/components/account/PerfilForm";
import { userApiGetSafe } from "@/lib/api-user";
import type { UserProfile } from "@/lib/types";

export default async function PerfilPage() {
  const result = await userApiGetSafe<UserProfile>("/api/auth/profile/");
  if (!result.ok) {
    redirect("/cuenta/login?next=/cuenta/perfil");
  }

  return <PerfilForm initialProfile={result.data} />;
}
