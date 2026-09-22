// Suspense fallback mientras carga el home — Navbar/Footer siguen
// montados (viven en SiteChrome, fuera de este boundary).
export default function HomeLoading() {
  return (
    <div className="flex min-h-150 flex-1 flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />
      <p className="text-sm font-medium">Cargando...</p>
    </div>
  );
}
