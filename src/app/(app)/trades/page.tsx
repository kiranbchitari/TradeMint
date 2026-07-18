import type { Metadata } from "next";

import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getUserCurrency } from "@/features/auth/queries";
import { SeedDemoButton } from "@/features/dev/components/seed-demo-button";
import { JournalTable } from "@/features/trades/components/journal-table";
import { NewTradeButton } from "@/features/trades/components/new-trade-button";
import { getTradesWithRelations } from "@/features/trades/queries";

export const metadata: Metadata = { title: "Trades" };

export default async function TradesPage() {
  const [trades, currency] = await Promise.all([
    getTradesWithRelations(),
    getUserCurrency(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Trades"
        description="The complete log of your trades."
        actions={<NewTradeButton />}
      />
      {trades.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No trades yet"
          description="Log your first trade, or load a demo dataset to explore."
          action={<SeedDemoButton />}
          className="py-20"
        />
      ) : (
        <JournalTable trades={trades} currency={currency} />
      )}
    </PageContainer>
  );
}
