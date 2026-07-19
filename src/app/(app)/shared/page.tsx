import type { Metadata } from "next";
import Link from "next/link";

import { Users2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SymbolIcon } from "@/components/symbol-icon";
import { Badge } from "@/components/ui/badge";
import { getUserCurrency } from "@/features/auth/queries";
import { PnlText } from "@/features/trades/components/trade-badges";
import { getSharedTrades } from "@/features/trades/queries";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Shared with me" };

const ROLE_LABELS: Record<string, string> = {
  viewer: "View only",
  commenter: "Can comment",
  editor: "Can edit",
};

export default async function SharedPage() {
  const [shared, currency] = await Promise.all([
    getSharedTrades(),
    getUserCurrency(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Shared with me"
        description="Trades other traders have invited you to collaborate on."
      />

      {shared.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Nothing shared yet"
          description="When someone shares a trade with you, it shows up here."
          className="py-20"
        />
      ) : (
        <SectionCard contentClassName="p-0">
          <ul className="divide-y">
            {shared.map(({ trade, role, ownerName, ownerEmail, sharedAt }) => (
              <li key={trade.id}>
                <Link
                  href={`/trades/${trade.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <SymbolIcon
                    symbol={trade.symbol}
                    market={trade.market}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.symbol}</span>
                      <Badge variant="secondary" className="text-[11px]">
                        {ROLE_LABELS[role] ?? role}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Shared by {ownerName ?? ownerEmail ?? "a trader"} ·{" "}
                      {formatDateTime(sharedAt)}
                    </p>
                  </div>
                  <PnlText value={trade.net_pnl} currency={currency} />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </PageContainer>
  );
}
