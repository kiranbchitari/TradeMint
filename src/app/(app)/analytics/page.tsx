import type { Metadata } from "next";

import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { getUserCurrency } from "@/features/auth/queries";
import { AiPlaceholderCard } from "@/features/ai/components/ai-placeholder-card";
import { CategoryBarChart } from "@/features/analytics/components/category-bar-chart";
import { DrawdownChart } from "@/features/analytics/components/drawdown-chart";
import { EquityCurveChart } from "@/features/analytics/components/equity-curve-chart";
import { RDistributionChart } from "@/features/analytics/components/r-distribution-chart";
import { WinLossDonut } from "@/features/analytics/components/win-loss-donut";
import {
  computeKpis,
  drawdownSeries,
  equityCurve,
  getClosedTrades,
  maxDrawdown,
  pnlByHour,
  pnlByMonth,
  pnlByWeekday,
  rMultipleDistribution,
  type BucketPoint,
} from "@/features/analytics/metrics";
import { getTradesWithRelations } from "@/features/trades/queries";
import {
  formatCurrency,
  formatNumber,
  formatSignedCurrency,
  pnlColorClass,
} from "@/lib/format";
import type { TradeWithRelations } from "@/types/models";

export const metadata: Metadata = { title: "Analytics" };

function strategyBuckets(trades: TradeWithRelations[]): BucketPoint[] {
  const map = new Map<string, { pnl: number; trades: number; wins: number }>();
  for (const t of trades) {
    if (t.status !== "closed" || t.net_pnl == null) continue;
    const key = t.strategy?.name ?? "Unassigned";
    const g = map.get(key) ?? { pnl: 0, trades: 0, wins: 0 };
    g.pnl += t.net_pnl;
    g.trades += 1;
    if (t.net_pnl > 0) g.wins += 1;
    map.set(key, g);
  }
  return [...map.entries()]
    .map(([label, g]) => ({
      key: label,
      label,
      pnl: g.pnl,
      trades: g.trades,
      winRate: (g.wins / g.trades) * 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default async function AnalyticsPage() {
  const [trades, currency] = await Promise.all([
    getTradesWithRelations(),
    getUserCurrency(),
  ]);

  if (getClosedTrades(trades).length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Deep-dive into your trading performance."
        />
        <EmptyState
          icon={BarChart3}
          title="Not enough data"
          description="Close some trades to unlock analytics."
          className="py-20"
        />
      </PageContainer>
    );
  }

  const kpis = computeKpis(trades);
  const equity = equityCurve(trades);
  const drawdown = drawdownSeries(equity);
  const months = pnlByMonth(trades);
  const bestMonth = [...months].sort((a, b) => b.pnl - a.pnl)[0];
  const worstMonth = [...months].sort((a, b) => a.pnl - b.pnl)[0];

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Deep-dive into your trading performance."
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Profit Factor"
            value={kpis.profitFactor == null ? "—" : formatNumber(kpis.profitFactor, 2)}
          />
          <StatCard
            label="Expectancy"
            value={formatSignedCurrency(kpis.expectancy, currency)}
            valueClassName={pnlColorClass(kpis.expectancy)}
          />
          <StatCard label="Avg Holding" value={formatDuration(kpis.avgHoldingMs)} />
          <StatCard
            label="Max Drawdown"
            value={formatCurrency(maxDrawdown(equity), currency)}
            valueClassName="text-loss"
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
          <StatCard
            label="Best Month"
            value={bestMonth ? formatSignedCurrency(bestMonth.pnl, currency) : "—"}
            valueClassName="text-profit"
            hint={bestMonth?.label}
          />
          <StatCard
            label="Worst Month"
            value={worstMonth ? formatSignedCurrency(worstMonth.pnl, currency) : "—"}
            valueClassName="text-loss"
            hint={worstMonth?.label}
          />
        </div>

        <SectionCard title="Equity curve" contentClassName="p-4">
          <EquityCurveChart data={equity} currency={currency} height={300} />
        </SectionCard>

        <SectionCard title="Drawdown" contentClassName="p-4">
          <DrawdownChart data={drawdown} currency={currency} />
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Win / Loss" contentClassName="p-4">
            <WinLossDonut
              wins={kpis.wins}
              losses={kpis.losses}
              breakevens={kpis.breakevens}
            />
          </SectionCard>
          <SectionCard
            title="R-multiple distribution"
            className="lg:col-span-2"
            contentClassName="p-4"
          >
            <RDistributionChart data={rMultipleDistribution(trades)} />
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Performance by weekday" contentClassName="p-4">
            <CategoryBarChart data={pnlByWeekday(trades)} currency={currency} />
          </SectionCard>
          <SectionCard title="Performance by hour" contentClassName="p-4">
            <CategoryBarChart data={pnlByHour(trades)} currency={currency} />
          </SectionCard>
        </div>

        <SectionCard title="Performance by strategy" contentClassName="p-4">
          <CategoryBarChart data={strategyBuckets(trades)} currency={currency} />
        </SectionCard>

        <SectionCard title="Monthly P&L" contentClassName="p-4">
          <CategoryBarChart data={months} currency={currency} />
        </SectionCard>

        <AiPlaceholderCard
          title="AI Pattern Detection"
          description="Surface hidden edges and leaks — recurring setups, times of day, and emotional states that drive your best and worst results."
          bullets={[
            "Best & worst conditions",
            "Overtrading detection",
            "Emotion vs. outcome",
            "Actionable suggestions",
          ]}
        />
      </div>
    </PageContainer>
  );
}
