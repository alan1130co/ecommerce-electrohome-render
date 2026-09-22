import BannerForm from "@/components/dashboard/BannerForm";

export default function NuevoBannerPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
          <i className="fas fa-image text-amber-500" /> Crear Banner
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Banners que aparecen en el home</p>
      </div>
      <BannerForm />
    </div>
  );
}
