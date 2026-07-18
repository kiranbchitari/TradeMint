import type { Metadata } from "next";

import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getUserCurrency } from "@/features/auth/queries";
import { SeedDemoButton } from "@/features/dev/components/seed-demo-button";
import { JournalTable } from "@/features/trades/components/journal-table";
import { NewTradeButton } from "@/features/trades/components/new-trade-button";
import { getTradesWithRelations } from "@/features/trades/queries";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const [trades, currency] = await Promise.all([
    getTradesWithRelations(),
    getUserCurrency(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Journal"
        description="Every trade, searchable and sortable."
        actions={<NewTradeButton />}
      />
      {trades.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your journal is empty"
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
