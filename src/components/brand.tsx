import { CandlestickChart } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-7", icon: "size-4", text: "text-sm" },
  md: { box: "size-9", icon: "size-5", text: "text-base" },
  lg: { box: "size-11", icon: "size-6", text: "text-lg" },
} as const;

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: keyof typeof sizes;
}) {
  const s = sizes[size];
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          s.box,
        )}
      >
        <CandlestickChart className={s.icon} />
      </span>
      {showText && (
        <span className={cn("font-semibold tracking-tight", s.text)}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
