"use client";

interface TooltipItem {
  value?: number | string;
  name?: string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number, item: TooltipItem) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null && (
        <p className="mb-1 font-medium text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </p>
      )}
      <div className="space-y-0.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2 tabular-nums">
            {item.color && (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium text-popover-foreground">
              {valueFormatter && typeof item.value === "number"
                ? valueFormatter(item.value, item)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
