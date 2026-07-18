"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { BucketPoint } from "../metrics";

import { ChartTooltip } from "./chart-tooltip";

export function CategoryBarChart({
  data,
  currency = "USD",
  height = 260,
}: {
  data: BucketPoint[];
  currency?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
          tickLine={false}
          axisLine={false}
          width={62}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltip valueFormatter={(v) => formatCurrency(v, currency)} />}
        />
        <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]} maxBarSize={44}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
