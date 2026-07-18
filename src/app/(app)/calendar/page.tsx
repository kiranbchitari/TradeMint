import type { Metadata } from "next";
import Link from "next/link";

import {
  addMonths,
  format,
  parse,
  parseISO,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getUserCurrency } from "@/features/auth/queries";
import { pnlByDay } from "@/features/analytics/metrics";
import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import {
  DirectionBadge,
  PnlText,
} from "@/features/trades/components/trade-badges";
import { getTradesWithRelations } from "@/features/trades/queries";
import { formatDate, formatSignedCurrency, pnlColorClass } from "@/lib/format";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { month: monthParam, date: dateParam } = await searchParams;
  const [trades, currency] = await Promise.all([
    getTradesWithRelations(),
    getUserCurrency(),
  ]);

  const month = monthParam
    ? parse(monthParam, "yyyy-MM", new Date())
    : new Date();
  const monthKey = format(month, "yyyy-MM");
  const prev = format(subMonths(month, 1), "yyyy-MM");
  const next = format(addMonths(month, 1), "yyyy-MM");

  const dayMap = pnlByDay(trades);
  const calendarData = Object.fromEntries(dayMap.entries());

  // This month's summary.
  const monthDays = [...dayMap.entries()].filter(([k]) => k.startsWith(monthKey));
  const monthPnl = monthDays.reduce((s, [, v]) => s + v.pnl, 0);
  const winDays = monthDays.filter(([, v]) => v.pnl > 0).length;

  const dayTrades = dateParam
    ? trades.filter(
        (t) => format(parseISO(t.exit_at ?? t.entry_at), "yyyy-MM-dd") === dateParam,
      )
    : [];
  const dayPnl = dayTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Your daily P&L at a glance."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" asChild>
              <Link href={`/calendar?month=${prev}`} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <span className="w-32 text-center text-sm font-medium">
              {format(month, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon-sm" asChild>
              <Link href={`/calendar?month=${next}`} aria-label="Next month">
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Month P&L"
          value={formatSignedCurrency(monthPnl, currency)}
          valueClassName={pnlColorClass(monthPnl)}
        />
        <StatCard label="Trading days" value={monthDays.length} />
        <StatCard label="Green days" value={winDays} valueClassName="text-profit" />
        <StatCard
          label="Red days"
          value={monthDays.length - winDays}
          valueClassName="text-loss"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" contentClassName="p-4">
          <MonthCalendar month={month} data={calendarData} currency={currency} />
        </SectionCard>

        <SectionCard
          title={dateParam ? formatDate(dateParam) : "Select a day"}
          description={dateParam ? undefined : "Click a day to see its trades"}
        >
          {!dateParam ? (
            <EmptyState
              icon={CalendarDays}
              title="No day selected"
              description="Pick a day on the calendar to review its trades."
              className="border-0"
            />
          ) : dayTrades.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No trades"
              description="No trades were logged on this day."
              className="border-0"
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm text-muted-foreground">Day P&L</span>
                <PnlText value={dayPnl} currency={currency} />
              </div>
              <ul className="space-y-1">
                {dayTrades.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/trades/${t.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">{t.symbol}</span>
                      <DirectionBadge direction={t.direction} />
                      <PnlText
                        value={t.net_pnl}
                        currency={currency}
                        className="ml-auto"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
