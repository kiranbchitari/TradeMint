import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-header";
import { ImportTrades } from "@/features/trades/components/import-trades";

export const metadata: Metadata = { title: "Import trades" };

export default function ImportPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Import trades"
        description="Bring in your trade history from a CSV file."
      />
      <ImportTrades />
    </PageContainer>
  );
}
