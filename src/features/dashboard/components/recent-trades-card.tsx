import Link from "next/link";

import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { formatDate } from "@/lib/format";
import {
  DirectionBadge,
  PnlText,
} from "@/features/trades/components/trade-badges";
import type { TradeWithRelations } from "@/types/models";

export function RecentTradesCard({
  trades,
  currency,
}: {
  trades: TradeWithRelations[];
  currency: string;
}) {
  return (
    <SectionCard title="Recent trades" href="/journal" contentClassName="p-2">
      {trades.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No trades yet"
          description="Log your first trade with the New trade button."
          className="border-0"
        />
      ) : (
        <ul>
          {trades.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trades/${t.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.symbol}</span>
                    <DirectionBadge direction={t.direction} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.strategy?.name ? `${t.strategy.name} · ` : ""}
                    {formatDate(t.exit_at ?? t.entry_at)}
                  </p>
                </div>
                <PnlText value={t.net_pnl} currency={currency} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
