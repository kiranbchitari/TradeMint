"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatNumber,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlColorClass,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/models";

export interface StrategyStats {
  pnl: number;
  trades: number;
  winRate: number;
  avgR: number | null;
}

export function StrategyCard({
  strategy,
  stats,
  currency,
  onEdit,
  onDelete,
}: {
  strategy: Strategy;
  stats: StrategyStats;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ruleCount = strategy.rules.length;
  const checklistCount = Array.isArray(strategy.checklist)
    ? strategy.checklist.length
    : 0;

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: strategy.color ?? "var(--color-primary)" }}
          />
          <h3 className="font-semibold">{strategy.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Strategy actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {strategy.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {strategy.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Net P&L">
          <span className={cn("font-mono", pnlColorClass(stats.pnl))}>
            {formatSignedCurrency(stats.pnl, currency)}
          </span>
        </Stat>
        <Stat label="Win rate">
          <span className="font-mono">{formatPercent(stats.winRate)}</span>
        </Stat>
        <Stat label="Trades">
          <span className="font-mono">{formatNumber(stats.trades, 0)}</span>
        </Stat>
        <Stat label="Avg R / Exp RR">
          <span className="font-mono">
            {stats.avgR == null ? "—" : formatR(stats.avgR)}
            {strategy.expected_rr != null && (
              <span className="text-muted-foreground">
                {" "}
                / {formatNumber(strategy.expected_rr, 1)}
              </span>
            )}
          </span>
        </Stat>
      </div>

      {(ruleCount > 0 || checklistCount > 0) && (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          {ruleCount} rules · {checklistCount} checklist items
        </p>
      )}
    </Card>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium tabular-nums">{children}</p>
    </div>
  );
}
