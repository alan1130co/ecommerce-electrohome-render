import BannerForm from "@/components/dashboard/BannerForm";
import { adminApiGet } from "@/lib/api-admin";
import type { BannerAdmin } from "@/lib/dashboard-types";

export default async function EditarBannerPage(props: PageProps<"/dashboard/secciones/banners/[id]/editar">) {
  const { id } = await props.params;
  const banner = await adminApiGet<BannerAdmin>(`/api/dashboard/banners/${id}/`);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar banner: {banner.titulo}</h1>
      <BannerForm banner={banner} />
    </div>
  );
}
