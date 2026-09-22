"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrecio } from "@/lib/orderStatus";
import { useThemeStore } from "@/store/themeStore";

export default function IngresosChart({ data, height = 320 }: { data: { dia: string; total: number }[]; height?: number }) {
  const dark = useThemeStore((s) => s.dark);
  const gridStroke = dark ? "#334155" : "#f1f5f9";
  const axisStroke = dark ? "#475569" : "#e2e8f0";
  const tickFill = dark ? "#94a3b8" : "#94a3b8";
  const lineStroke = dark ? "#60a5fa" : "#1d4ed8";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 11, fill: tickFill }}
          axisLine={{ stroke: axisStroke }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickFill }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatPrecio(v)}
          width={90}
        />
        <Tooltip
          formatter={(v) => formatPrecio(Number(v))}
          labelStyle={{ color: dark ? "#f1f5f9" : "#1e293b" }}
          contentStyle={dark ? { background: "#1e293b", border: "1px solid #475569" } : undefined}
        />
        <Area
          type="monotone"
          dataKey="total"
          name="Ingresos ($)"
          stroke={lineStroke}
          strokeWidth={2}
          fill={lineStroke}
          fillOpacity={0.08}
          dot={{ r: 3, fill: lineStroke, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
