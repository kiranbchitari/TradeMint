"use client";

import * as React from "react";

import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiPlaceholderCard } from "@/features/ai/components/ai-placeholder-card";
import { CategoryBarChart } from "@/features/analytics/components/category-bar-chart";
import { EquityCurveChart } from "@/features/analytics/components/equity-curve-chart";
import {
  computeKpis,
  equityCurve,
  pnlByWeekday,
} from "@/features/analytics/metrics";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlColorClass,
} from "@/lib/format";
import type { TradeWithRelations } from "@/types/models";

type PeriodType = "weekly" | "monthly" | "yearly";

function periodRange(type: PeriodType, offset: number, now: Date) {
  if (type === "weekly") {
    const d = addWeeks(now, offset);
    return {
      start: startOfWeek(d, { weekStartsOn: 1 }),
      end: endOfWeek(d, { weekStartsOn: 1 }),
    };
  }
  if (type === "monthly") {
    const d = addMonths(now, offset);
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }
  const d = addYears(now, offset);
  return { start: startOfYear(d), end: endOfYear(d) };
}

const LABELS: Record<PeriodType, string> = {
  weekly: "Weekly Report",
  monthly: "Monthly Report",
  yearly: "Yearly Report",
};

export function ReportBuilder({
  trades,
  currency,
}: {
  trades: TradeWithRelations[];
  currency: string;
}) {
  const [type, setType] = React.useState<PeriodType>("monthly");
  const [offset, setOffset] = React.useState(0);

  // Static "now" per render is fine; navigation uses offset.
  const now = React.useMemo(() => new Date(), []);
  const { start, end } = periodRange(type, offset, now);

  const inRange = trades.filter((t) => {
    const d = parseISO(t.exit_at ?? t.entry_at);
    return isWithinInterval(d, { start, end });
  });

  const kpis = computeKpis(inRange);
  const equity = equityCurve(inRange);
  const weekday = pnlByWeekday(inRange);

  const rangeLabel =
    type === "yearly"
      ? format(start, "yyyy")
      : type === "monthly"
        ? format(start, "MMMM yyyy")
        : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;

  const mistakeCounts = new Map<string, number>();
  for (const t of inRange)
    for (const m of t.mistakes)
      mistakeCounts.set(m.label, (mistakeCounts.get(m.label) ?? 0) + 1);
  const topMistakes = [...mistakeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Select value={type} onValueChange={(v) => { setType(v as PeriodType); setOffset(0); }}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-44 text-center text-sm font-medium">{rangeLabel}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          className="ml-auto"
          variant="outline"
          onClick={() => window.print()}
        >
          <Printer className="size-4" /> Export PDF
        </Button>
      </div>

      {/* Report body */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{LABELS[type]}</h2>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Net P&L"
            value={formatSignedCurrency(kpis.totalPnl, currency)}
            valueClassName={pnlColorClass(kpis.totalPnl)}
          />
          <StatCard label="Trades" value={formatNumber(kpis.totalTrades, 0)} />
          <StatCard label="Win Rate" value={formatPercent(kpis.winRate)} />
          <StatCard
            label="Profit Factor"
            value={kpis.profitFactor == null ? "—" : formatNumber(kpis.profitFactor, 2)}
          />
          <StatCard
            label="Expectancy"
            value={formatSignedCurrency(kpis.expectancy, currency)}
            valueClassName={pnlColorClass(kpis.expectancy)}
          />
          <StatCard
            label="Average RR"
            value={kpis.avgRR == null ? "—" : formatR(kpis.avgRR)}
          />
          <StatCard
            label="Largest Win"
            value={formatCurrency(kpis.largestWin, currency)}
            valueClassName="text-profit"
          />
          <StatCard
            label="Largest Loss"
            value={formatCurrency(kpis.largestLoss, currency)}
            valueClassName="text-loss"
          />
        </div>

        {inRange.length === 0 ? (
          <SectionCard>
            <p className="py-8 text-center text-sm text-muted-foreground">
              No trades in this period.
            </p>
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Equity curve" contentClassName="p-4">
              <EquityCurveChart data={equity} currency={currency} height={240} />
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Performance by weekday" contentClassName="p-4">
                <CategoryBarChart data={weekday} currency={currency} height={220} />
              </SectionCard>
              <SectionCard title="Top mistakes">
                {topMistakes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No mistakes logged this period. 🎯
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {topMistakes.map(([label, count]) => (
                      <li
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{label}</span>
                        <span className="font-medium tabular-nums text-muted-foreground">
                          {count}×
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </>
        )}

        <div className="print:hidden">
          <AiPlaceholderCard
            title="AI Weekly Coach"
            description="Get a written performance review with strengths, leaks and a focused plan for next period — generated from this report's data."
          />
        </div>
      </div>
    </div>
  );
}
