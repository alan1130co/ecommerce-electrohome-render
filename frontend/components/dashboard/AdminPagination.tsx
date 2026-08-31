import Link from "next/link";

/** Pagination Server Component genérica para los listados de /dashboard —
 * misma idea que la paginación de /productos (Links con searchParams,
 * cero JS), adaptada al sobre {current_page,num_pages,has_next,has_previous}
 * de _paginate() en dashboard/api_views.py. */
export default function AdminPagination({
  currentPage,
  numPages,
  hasNext,
  hasPrevious,
  basePath,
  searchParams,
}: {
  currentPage: number;
  numPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (numPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {hasPrevious ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-300">
          ← Anterior
        </span>
      )}
      <span className="text-sm text-gray-600">
        Página {currentPage} de {numPages}
      </span>
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-300">
          Siguiente →
        </span>
      )}
    </div>
  );
}
