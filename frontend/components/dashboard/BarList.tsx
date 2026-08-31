/** Barra horizontal simple con CSS puro — sin dependencias de charting para
 * un panel interno cuyo único consumo es lectura rápida de tendencias. */
export default function BarList({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = formatValue ?? ((v: number) => String(v));

  if (items.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos todavía.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-gray-600" title={item.label}>
            {item.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-medium text-gray-700">
            {fmt(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
