import {
  Activity,
  Flame,
  Percent,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlColorClass,
} from "@/lib/format";
import type { KpiSummary } from "@/features/analytics/metrics";

export function DashboardKpis({
  kpis,
  todayPnl,
  weekPnl,
  monthPnl,
  currency,
}: {
  kpis: KpiSummary;
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  currency: string;
}) {
  const streakLabel =
    kpis.currentStreak === 0
      ? "—"
      : `${Math.abs(kpis.currentStreak)}${kpis.currentStreak > 0 ? "W" : "L"}`;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <StatCard
        label="Today's P&L"
        value={formatSignedCurrency(todayPnl, currency)}
        icon={TrendingUp}
        valueClassName={pnlColorClass(todayPnl)}
      />
      <StatCard
        label="Weekly P&L"
        value={formatSignedCurrency(weekPnl, currency)}
        icon={Activity}
        valueClassName={pnlColorClass(weekPnl)}
      />
      <StatCard
        label="Monthly P&L"
        value={formatSignedCurrency(monthPnl, currency)}
        icon={Activity}
        valueClassName={pnlColorClass(monthPnl)}
      />
      <StatCard
        label="Net P&L"
        value={formatSignedCurrency(kpis.totalPnl, currency)}
        icon={Scale}
        valueClassName={pnlColorClass(kpis.totalPnl)}
        hint={`${kpis.totalTrades} trades`}
      />
      <StatCard
        label="Win Rate"
        value={formatPercent(kpis.winRate)}
        icon={Percent}
        hint={`${kpis.wins}W · ${kpis.losses}L`}
      />
      <StatCard
        label="Profit Factor"
        value={kpis.profitFactor == null ? "—" : formatNumber(kpis.profitFactor, 2)}
        icon={Target}
      />
      <StatCard
        label="Expectancy"
        value={formatSignedCurrency(kpis.expectancy, currency)}
        icon={Target}
        valueClassName={pnlColorClass(kpis.expectancy)}
        hint="per trade"
      />
      <StatCard
        label="Average RR"
        value={kpis.avgRR == null ? "—" : formatR(kpis.avgRR)}
        icon={Scale}
        valueClassName={kpis.avgRR != null ? pnlColorClass(kpis.avgRR) : undefined}
      />
      <StatCard
        label="Average Winner"
        value={formatCurrency(kpis.avgWinner, currency)}
        icon={TrendingUp}
        valueClassName="text-profit"
      />
      <StatCard
        label="Average Loser"
        value={formatCurrency(kpis.avgLoser, currency)}
        icon={TrendingDown}
        valueClassName="text-loss"
      />
      <StatCard
        label="Current Streak"
        value={streakLabel}
        icon={Flame}
        valueClassName={pnlColorClass(kpis.currentStreak)}
      />
      <StatCard
        label="Longest Win Streak"
        value={formatNumber(kpis.longestWinStreak, 0)}
        icon={Trophy}
        hint={`Loss streak: ${kpis.longestLossStreak}`}
      />
    </div>
  );
}
