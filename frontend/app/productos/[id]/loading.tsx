// Suspense fallback para el detalle de producto — más específico que el
// de /productos, Next.js usa este en vez del del padre para esta ruta.
export default function ProductoDetailLoading() {
  return (
    <div className="flex min-h-150 flex-1 flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />
      <p className="text-sm font-medium">Cargando producto...</p>
    </div>
  );
}
