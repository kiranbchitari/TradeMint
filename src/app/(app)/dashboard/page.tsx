import type { Metadata } from "next";

import {
  format,
  isThisMonth,
  isThisWeek,
  isToday,
  parseISO,
} from "date-fns";
import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { getUserCurrency } from "@/features/auth/queries";
import {
  computeKpis,
  equityCurve,
  getClosedTrades,
  pnlByDay,
} from "@/features/analytics/metrics";
import { DailyPnlChart } from "@/features/analytics/components/daily-pnl-chart";
import { EquityCurveChart } from "@/features/analytics/components/equity-curve-chart";
import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import { DashboardKpis } from "@/features/dashboard/components/dashboard-kpis";
import { RecentNotesCard } from "@/features/dashboard/components/recent-notes-card";
import { RecentTradesCard } from "@/features/dashboard/components/recent-trades-card";
import { TopMistakesCard } from "@/features/dashboard/components/top-mistakes-card";
import { TopStrategiesCard } from "@/features/dashboard/components/top-strategies-card";
import { SeedDemoButton } from "@/features/dev/components/seed-demo-button";
import { getNotes } from "@/features/notes/queries";
import { getTradesWithRelations } from "@/features/trades/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [trades, notes, currency] = await Promise.all([
    getTradesWithRelations(),
    getNotes(),
    getUserCurrency(),
  ]);

  if (trades.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Your trading performance at a glance."
        />
        <EmptyState
          icon={LayoutDashboard}
          title="No trades yet"
          description="Press N or use the New trade button to log your first trade — or load a demo dataset to explore TradeMint."
          action={<SeedDemoButton />}
          className="py-20"
        />
      </PageContainer>
    );
  }

  const closed = getClosedTrades(trades);
  const kpis = computeKpis(trades);
  const equity = equityCurve(trades);

  const dateOf = (t: (typeof closed)[number]) =>
    parseISO(t.exit_at ?? t.entry_at);
  const sumWhere = (pred: (d: Date) => boolean) =>
    closed.filter((t) => pred(dateOf(t))).reduce((s, t) => s + t.net_pnl, 0);

  const todayPnl = sumWhere((d) => isToday(d));
  const weekPnl = sumWhere((d) => isThisWeek(d, { weekStartsOn: 1 }));
  const monthPnl = sumWhere((d) => isThisMonth(d));

  const dayMap = pnlByDay(trades);
  const calendarData = Object.fromEntries(dayMap.entries());
  const daily = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([k, v]) => ({ label: format(parseISO(k), "MMM d"), pnl: v.pnl }));

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Your trading performance at a glance."
      />

      <div className="space-y-4">
        <DashboardKpis
          kpis={kpis}
          todayPnl={todayPnl}
          weekPnl={weekPnl}
          monthPnl={monthPnl}
          currency={currency}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="Equity curve"
            description="Cumulative realized P&L"
            href="/analytics"
            className="lg:col-span-2"
            contentClassName="p-4"
          >
            <EquityCurveChart data={equity} currency={currency} />
          </SectionCard>

          <SectionCard
            title={format(new Date(), "MMMM yyyy")}
            description="Daily P&L"
            href="/calendar"
            contentClassName="p-4"
          >
            <MonthCalendar
              month={new Date()}
              data={calendarData}
              currency={currency}
              size="sm"
            />
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="Daily performance"
            description="Last 30 trading days"
            className="lg:col-span-2"
            contentClassName="p-4"
          >
            <DailyPnlChart data={daily} currency={currency} />
          </SectionCard>

          <TopStrategiesCard trades={trades} currency={currency} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentTradesCard trades={trades.slice(0, 6)} currency={currency} />
          </div>
          <div className="space-y-4">
            <TopMistakesCard trades={trades} />
            <RecentNotesCard notes={notes} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
