const COLORS = {
  blue: "bg-blue-700/10 text-blue-700",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  cyan: "bg-cyan-500/10 text-cyan-500",
} as const;

export default function StatCard({
  icon,
  color,
  label,
  value,
  small,
}: {
  icon: string;
  color: keyof typeof COLORS;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:bg-slate-800">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${COLORS[color]}`}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="text-xs font-bold tracking-wide text-slate-400 uppercase">{label}</div>
        <div className={`font-bold text-slate-900 dark:text-slate-100 ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
      </div>
    </div>
  );
}
