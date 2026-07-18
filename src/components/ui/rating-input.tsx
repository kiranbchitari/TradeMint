"use client";

import { cn } from "@/lib/utils";

/** A compact 1–5 rating selector (filled dots). */
export function RatingInput({
  value,
  onChange,
  max = 5,
  className,
  disabled,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  max?: number;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${n}`}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "size-6 rounded-md border text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {n}
          </button>
        );
      })}
      {value != null && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
