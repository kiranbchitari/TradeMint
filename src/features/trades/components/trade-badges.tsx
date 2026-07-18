import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DIRECTION_LABELS, TRADE_STATUS_LABELS, type Direction, type TradeStatus } from "@/lib/constants";
import { formatSignedCurrency, pnlColorClass } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DirectionBadge({ direction }: { direction: string }) {
  const long = direction === "long";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        long
          ? "border-profit/30 text-profit"
          : "border-loss/30 text-loss",
      )}
    >
      {long ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {DIRECTION_LABELS[direction as Direction] ?? direction}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open: "border-primary/30 text-primary",
  closed: "border-border text-muted-foreground",
  cancelled: "border-border text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {TRADE_STATUS_LABELS[status as TradeStatus] ?? status}
    </Badge>
  );
}

const GRADE_STYLES: Record<string, string> = {
  A: "bg-profit/15 text-profit",
  B: "bg-profit/10 text-profit",
  C: "bg-muted text-muted-foreground",
  D: "bg-loss/10 text-loss",
  F: "bg-loss/15 text-loss",
};

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold",
        GRADE_STYLES[grade] ?? "bg-muted text-muted-foreground",
      )}
    >
      {grade}
    </span>
  );
}

export function PnlText({
  value,
  currency = "USD",
  className,
}: {
  value: number | null | undefined;
  currency?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums",
        pnlColorClass(value),
        className,
      )}
    >
      {value == null ? "—" : formatSignedCurrency(value, currency)}
    </span>
  );
}
