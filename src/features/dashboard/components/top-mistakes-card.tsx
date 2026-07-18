import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { cn } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/models";

export function TopMistakesCard({
  trades,
}: {
  trades: TradeWithRelations[];
}) {
  const counts = new Map<
    string,
    { label: string; color: string | null; count: number }
  >();
  for (const t of trades) {
    for (const m of t.mistakes) {
      const c = counts.get(m.id) ?? { label: m.label, color: m.color, count: 0 };
      c.count += 1;
      counts.set(m.id, c);
    }
  }
  const rows = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <SectionCard title="Common mistakes" contentClassName="p-4">
      {rows.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No mistakes logged"
          description="Tag mistakes on your trades to surface patterns."
          className="border-0"
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: r.color ?? "var(--color-loss)" }}
              />
              <span className="w-28 shrink-0 truncate text-sm">{r.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full bg-loss/70")}
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium tabular-nums text-muted-foreground">
                {r.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
