import type { Metadata } from "next";

import { PageContainer } from "@/components/page-header";
import { getUserCurrency } from "@/features/auth/queries";
import { StrategiesManager } from "@/features/strategies/components/strategies-manager";
import type { StrategyStats } from "@/features/strategies/components/strategy-card";
import { getStrategies } from "@/features/strategies/queries";
import { getTrades } from "@/features/trades/queries";

export const metadata: Metadata = { title: "Strategies" };

export default async function StrategiesPage() {
  const [strategies, trades, currency] = await Promise.all([
    getStrategies(),
    getTrades(),
    getUserCurrency(),
  ]);

  const stats: Record<string, StrategyStats> = {};
  const acc = new Map<
    string,
    { pnl: number; trades: number; wins: number; rSum: number; rCount: number }
  >();

  for (const t of trades) {
    if (!t.strategy_id || t.status !== "closed" || t.net_pnl == null) continue;
    const a =
      acc.get(t.strategy_id) ?? { pnl: 0, trades: 0, wins: 0, rSum: 0, rCount: 0 };
    a.pnl += t.net_pnl;
    a.trades += 1;
    if (t.net_pnl > 0) a.wins += 1;
    if (t.r_multiple != null) {
      a.rSum += t.r_multiple;
      a.rCount += 1;
    }
    acc.set(t.strategy_id, a);
  }
  for (const [id, a] of acc) {
    stats[id] = {
      pnl: a.pnl,
      trades: a.trades,
      winRate: a.trades > 0 ? (a.wins / a.trades) * 100 : 0,
      avgR: a.rCount > 0 ? a.rSum / a.rCount : null,
    };
  }

  return (
    <PageContainer>
      <StrategiesManager
        strategies={strategies}
        stats={stats}
        currency={currency}
      />
    </PageContainer>
  );
}
