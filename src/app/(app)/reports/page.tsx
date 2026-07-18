import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-header";
import { getUserCurrency } from "@/features/auth/queries";
import { ReportBuilder } from "@/features/reports/components/report-builder";
import { getTradesWithRelations } from "@/features/trades/queries";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [trades, currency] = await Promise.all([
    getTradesWithRelations(),
    getUserCurrency(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="Generate and export weekly, monthly and yearly performance reports."
      />
      <ReportBuilder trades={trades} currency={currency} />
    </PageContainer>
  );
}
