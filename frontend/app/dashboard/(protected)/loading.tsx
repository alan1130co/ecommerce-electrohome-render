// Suspense fallback automático de Next.js para TODO lo que cuelga de este
// layout (todas las páginas de /dashboard/*) mientras esperan su fetch —
// el sidebar/header de DashboardShell no se desmonta, solo el contenido.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-100 flex-1 flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700 dark:border-slate-700 dark:border-t-blue-500" />
      <p className="text-sm font-medium">Cargando...</p>
    </div>
  );
}
