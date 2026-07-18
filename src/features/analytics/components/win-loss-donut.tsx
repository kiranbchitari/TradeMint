"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "./chart-tooltip";

export function WinLossDonut({
  wins,
  losses,
  breakevens,
  height = 220,
}: {
  wins: number;
  losses: number;
  breakevens: number;
  height?: number;
}) {
  const data = [
    { name: "Wins", value: wins, color: "var(--color-profit)" },
    { name: "Losses", value: losses, color: "var(--color-loss)" },
    { name: "Breakeven", value: breakevens, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

  const total = wins + losses + breakevens;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v} trades`} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">trades</span>
      </div>
    </div>
  );
}
