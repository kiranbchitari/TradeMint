import Link from "next/link";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { formatCompactCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DayData {
  pnl: number;
  count: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pnlText(pnl: number) {
  if (pnl > 0) return "text-profit";
  if (pnl < 0) return "text-loss";
  return "text-muted-foreground";
}

export function MonthCalendar({
  month,
  data,
  currency = "USD",
  size = "md",
  linkDays = true,
}: {
  month: Date;
  data: Record<string, DayData>;
  currency?: string;
  size?: "sm" | "md";
  linkDays?: boolean;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const maxAbs = Math.max(1, ...Object.values(data).map((d) => Math.abs(d.pnl)));

  // Group into calendar weeks (rows of 7) so we can append a week summary.
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // Week summary column is desktop-only — 8 columns are too cramped on phones,
  // so it collapses to 7 columns below the `sm` breakpoint.
  const showWeekCol = size !== "sm";
  const cellHeight = size === "sm" ? "min-h-12" : "min-h-16 sm:min-h-20";
  const gridCols = showWeekCol ? "grid-cols-7 sm:grid-cols-8" : "grid-cols-7";

  return (
    <div>
      {/* Weekday header */}
      <div className={cn("mb-1 grid gap-1", gridCols)}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {showWeekCol && (
          <div className="hidden py-1 text-center text-[11px] font-semibold text-muted-foreground sm:block">
            Week
          </div>
        )}
      </div>

      {/* Weeks */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const weekPnl = week.reduce(
            (s, day) => s + (data[format(day, "yyyy-MM-dd")]?.pnl ?? 0),
            0,
          );
          const weekDays = week.filter(
            (day) => data[format(day, "yyyy-MM-dd")],
          ).length;

          return (
            <div key={wi} className={cn("grid gap-1", gridCols)}>
              {week.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const d = data[key];
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const intensity = d
                  ? Math.round((Math.abs(d.pnl) / maxAbs) * 40) + 10
                  : 0;
                const bg =
                  d && d.pnl !== 0
                    ? `color-mix(in oklch, var(--color-${
                        d.pnl > 0 ? "profit" : "loss"
                      }) ${intensity}%, transparent)`
                    : undefined;

                const cell = (
                  <div
                    className={cn(
                      "flex h-full flex-col overflow-hidden rounded-lg border p-1.5 transition-all",
                      cellHeight,
                      inMonth ? "bg-card" : "bg-muted/30",
                      d && linkDays && "hover:ring-2 hover:ring-primary/40",
                      today && "ring-1 ring-primary",
                    )}
                    style={bg ? { backgroundColor: bg } : undefined}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center text-[11px] font-medium",
                        today &&
                          "rounded-full bg-primary font-semibold text-primary-foreground",
                        !today && inMonth && "text-foreground",
                        !today && !inMonth && "text-muted-foreground/50",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {d && (
                      <span
                        className={cn(
                          "mt-auto text-[11px] font-semibold tabular-nums",
                          pnlText(d.pnl),
                        )}
                      >
                        {formatCompactCurrency(d.pnl, currency)}
                      </span>
                    )}
                    {d && size !== "sm" && (
                      <span className="text-[10px] text-muted-foreground">
                        {d.count} {d.count === 1 ? "trade" : "trades"}
                      </span>
                    )}
                  </div>
                );

                return linkDays && d ? (
                  <Link
                    key={key}
                    href={`/calendar?date=${key}`}
                    className="block"
                  >
                    {cell}
                  </Link>
                ) : (
                  <div key={key}>{cell}</div>
                );
              })}

              {/* Week summary */}
              {showWeekCol && (
                <div
                  className={cn(
                    "hidden flex-col justify-center rounded-lg border border-dashed bg-muted/40 p-1.5 text-center sm:flex",
                    cellHeight,
                  )}
                >
                  {weekDays > 0 ? (
                    <>
                      <span
                        className={cn(
                          "text-[11px] font-semibold tabular-nums",
                          pnlText(weekPnl),
                        )}
                      >
                        {formatCompactCurrency(weekPnl, currency)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {weekDays} {weekDays === 1 ? "day" : "days"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
