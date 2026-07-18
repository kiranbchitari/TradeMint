import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  href,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {(title || action || href) && (
        <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="truncate text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
          {href && !action && (
            <Link
              href={href}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </header>
      )}
      <div className={cn("flex-1 p-5", contentClassName)}>{children}</div>
    </section>
  );
}
