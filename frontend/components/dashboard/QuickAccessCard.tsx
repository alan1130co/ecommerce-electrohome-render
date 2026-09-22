import Link from "next/link";

const BORDER_COLORS: Record<string, string> = {
  blue: "border-l-blue-700/20",
  yellow: "border-l-amber-500/20",
  green: "border-l-emerald-500/20",
  red: "border-l-red-500/20",
  purple: "border-l-violet-500/20",
  orange: "border-l-orange-500/20",
  cyan: "border-l-cyan-500/20",
  indigo: "border-l-indigo-500/20",
};

export default function QuickAccessCard({
  href,
  color,
  emoji,
  title,
  subtitle,
  badge,
  alert,
}: {
  href: string;
  color: keyof typeof BORDER_COLORS;
  emoji: string;
  title: string;
  subtitle: string;
  badge?: number;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border-l-2 bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:bg-slate-800 ${BORDER_COLORS[color]}`}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      {alert ? (
        <span className="rounded-full bg-linear-to-br from-red-500 to-red-600 px-2.5 py-1 text-xs font-bold text-white">
          !
        </span>
      ) : badge !== undefined ? (
        <span className="rounded-full bg-linear-to-br from-blue-700 to-blue-900 px-2.5 py-1 text-xs font-bold text-white">
          {badge}
        </span>
      ) : (
        <i className="fas fa-chevron-right text-slate-300 dark:text-slate-600" />
      )}
    </Link>
  );
}
