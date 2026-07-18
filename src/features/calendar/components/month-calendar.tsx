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

  const maxAbs = Math.max(
    1,
    ...Object.values(data).map((d) => Math.abs(d.pnl)),
  );

  const cellHeight = size === "sm" ? "min-h-12" : "min-h-16 sm:min-h-20";

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const d = data[key];
          const inMonth = isSameMonth(day, month);
          const intensity = d ? Math.round((Math.abs(d.pnl) / maxAbs) * 70) + 8 : 0;
          const bg =
            d && d.pnl !== 0
              ? `color-mix(in oklch, var(--color-${d.pnl > 0 ? "profit" : "loss"}) ${intensity}%, transparent)`
              : undefined;

          const cell = (
            <div
              className={cn(
                "flex h-full flex-col rounded-lg border p-1.5 transition-colors",
                cellHeight,
                inMonth ? "bg-card" : "bg-muted/30",
                d && linkDays && "hover:ring-2 hover:ring-primary/40",
                isToday(day) && "ring-1 ring-primary",
              )}
              style={bg ? { backgroundColor: bg } : undefined}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  inMonth ? "text-foreground" : "text-muted-foreground/50",
                )}
              >
                {format(day, "d")}
              </span>
              {d && (
                <span className="mt-auto text-[11px] font-medium tabular-nums">
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
            <Link key={key} href={`/calendar?date=${key}`} className="block">
              {cell}
            </Link>
          ) : (
            <div key={key}>{cell}</div>
          );
        })}
      </div>
    </div>
  );
}
