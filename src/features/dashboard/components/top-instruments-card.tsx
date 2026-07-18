import { CandlestickChart } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { SymbolIcon } from "@/components/symbol-icon";
import { formatPercent, formatSignedCurrency, pnlColorClass } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/models";

interface Agg {
  symbol: string;
  market: string;
  pnl: number;
  count: number;
  wins: number;
}

function aggregate(trades: TradeWithRelations[]): Agg[] {
  const map = new Map<string, Agg>();
  for (const t of trades) {
    if (t.status !== "closed" || t.net_pnl == null) continue;
    const symbol = t.symbol;
    const a =
      map.get(symbol) ??
      { symbol, market: t.market, pnl: 0, count: 0, wins: 0 };
    a.pnl += t.net_pnl;
    a.count += 1;
    if (t.net_pnl > 0) a.wins += 1;
    map.set(symbol, a);
  }
  return [...map.values()]
    .sort((x, y) => Math.abs(y.pnl) - Math.abs(x.pnl))
    .slice(0, 5);
}

export function TopInstrumentsCard({
  trades,
  currency,
}: {
  trades: TradeWithRelations[];
  currency: string;
}) {
  const rows = aggregate(trades);
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.pnl)));

  return (
    <SectionCard title="Top instruments" href="/journal" contentClassName="p-4">
      {rows.length === 0 ? (
        <EmptyState
          icon={CandlestickChart}
          title="No instrument data"
          description="Close some trades to see your most-traded instruments."
          className="border-0"
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.symbol} className="flex items-center gap-3">
              <SymbolIcon symbol={r.symbol} market={r.market} size="md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{r.symbol}</span>
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      pnlColorClass(r.pnl),
                    )}
                  >
                    {formatSignedCurrency(r.pnl, currency)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      r.pnl >= 0 ? "bg-profit" : "bg-loss",
                    )}
                    style={{ width: `${(Math.abs(r.pnl) / maxAbs) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.count} trades · {formatPercent((r.wins / r.count) * 100)} win
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
