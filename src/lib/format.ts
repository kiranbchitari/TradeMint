import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const date =
    typeof value === "string"
      ? parseISO(value)
      : value instanceof Date
        ? value
        : new Date(value);
  return isValid(date) ? date : null;
}

/** Format a monetary value, e.g. 1234.5 → "$1,234.50". */
export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/** Currency with an explicit sign, e.g. +$120.00 / -$40.00. */
export function formatSignedCurrency(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const formatted = formatCurrency(Math.abs(value), currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/** Compact currency for axis labels, e.g. $12.5k, $1.2M. */
export function formatCompactCurrency(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Format a percentage. `value` is already in percent units (e.g. 62.5 → "62.5%"). */
export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Format an R-multiple, e.g. 2.4 → "+2.40R". */
export function formatR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}R`;
}

export function formatDate(value: DateInput, pattern = "MMM d, yyyy"): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(
  value: DateInput,
  pattern = "MMM d, yyyy · h:mm a",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatRelative(value: DateInput): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

/** Tailwind text-color class based on the sign of a P&L value. */
export function pnlColorClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-profit" : "text-loss";
}
