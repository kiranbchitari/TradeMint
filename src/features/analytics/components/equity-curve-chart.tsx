"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { EquityPoint } from "../metrics";

import { ChartTooltip } from "./chart-tooltip";

export function EquityCurveChart({
  data,
  currency = "USD",
  height = 280,
}: {
  data: EquityPoint[];
  currency?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
          tickLine={false}
          axisLine={false}
          minTickGap={44}
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
          content={
            <ChartTooltip
              labelFormatter={(l) => format(parseISO(String(l)), "MMM d, yyyy")}
              valueFormatter={(v) => formatCurrency(v, currency)}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="equity"
          name="Equity"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#equityFill)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
