import Link from "next/link";

const pillClass = "rounded-lg bg-linear-to-br from-blue-700 to-blue-900 px-3.5 py-1.5 text-sm font-semibold text-white";

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
    <div className="mt-6 flex items-center justify-center gap-2">
      {hasPrevious && (
        <>
          <Link href={buildHref(1)} className={pillClass}>
            «
          </Link>
          <Link href={buildHref(currentPage - 1)} className={pillClass}>
            ‹
          </Link>
        </>
      )}
      <span className="rounded-lg bg-linear-to-br from-slate-900 to-blue-900 px-3.5 py-1.5 text-sm font-semibold text-white">
        {currentPage} / {numPages}
      </span>
      {hasNext && (
        <>
          <Link href={buildHref(currentPage + 1)} className={pillClass}>
            ›
          </Link>
          <Link href={buildHref(numPages)} className={pillClass}>
            »
          </Link>
        </>
      )}
    </div>
  );
}
