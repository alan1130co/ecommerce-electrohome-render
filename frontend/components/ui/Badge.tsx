import type { ReactNode } from "react";

export default function Badge({
  children,
  color = "bg-red-600",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold text-white ${color}`}
    >
      {children}
    </span>
  );
}
