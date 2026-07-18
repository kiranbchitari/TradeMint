import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";

/**
 * Reusable placeholder for upcoming AI features (Trade Review, Journal
 * Summary, Mistake Detection, Emotional Analysis, Weekly Coach, Pattern
 * Detection). Wiring to a model comes later.
 */
export function AiPlaceholderCard({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <SectionCard
      title={title}
      action={<Badge variant="secondary">Coming soon</Badge>}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>
          {bullets && bullets.length > 0 && (
            <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-primary" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="outline" size="sm" disabled>
          <Sparkles className="size-4" />
          Generate
        </Button>
      </div>
    </SectionCard>
  );
}
