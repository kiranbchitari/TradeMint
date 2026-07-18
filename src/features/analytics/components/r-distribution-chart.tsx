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

import type { RBucket } from "../metrics";

import { ChartTooltip } from "./chart-tooltip";

export function RDistributionChart({
  data,
  height = 260,
}: {
  data: RBucket[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={54}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltip valueFormatter={(v) => `${v} trades`} />}
        />
        <Bar dataKey="count" name="Trades" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.from < 0 ? "var(--color-loss)" : "var(--color-profit)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
