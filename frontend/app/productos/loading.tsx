// Suspense fallback para el catálogo (/productos) mientras resuelve el
// fetch de la lista de productos.
export default function ProductosLoading() {
  return (
    <div className="flex min-h-150 flex-1 flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />
      <p className="text-sm font-medium">Cargando productos...</p>
    </div>
  );
}
