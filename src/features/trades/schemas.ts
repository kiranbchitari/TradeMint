import { z } from "zod";

import {
  DIRECTIONS,
  EMOTIONS,
  GRADES,
  MARKETS,
  TRADE_STATUSES,
} from "@/lib/constants";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;

const requiredNumber = (msg: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ message: msg }),
  );

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().optional(),
);

// A number that falls back to a default when left blank. NOTE: `.default()`
// only fires on `undefined` INPUT, but a blank form field arrives as "" which
// `emptyToUndefined` turns into `undefined` *inside* the preprocess — too late
// for an outer `.default()`. So substitute the fallback up front instead, or an
// empty "Fees" field coerces to NaN and the form rejects it.
const numberWithFallback = (fallback: number) =>
  z.preprocess((v) => (v === "" || v == null ? fallback : v), z.coerce.number());

// 1–5 integer rating; blank clears it. Matches the DB CHECK (1..5) so an
// out-of-range value is caught here with a friendly message, not a raw PG error.
const optionalRating = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(5).optional(),
);

export const tradeFormSchema = z
  .object({
    symbol: z.string().trim().min(1, "Instrument is required").max(32),
    market: z.enum(MARKETS),
    direction: z.enum(DIRECTIONS),
    status: z.enum(TRADE_STATUSES),

    accountId: z.string().uuid().nullish(),
    brokerId: z.string().uuid().nullish(),
    strategyId: z.string().uuid().nullish(),

    entryPrice: requiredNumber("Entry price is required").pipe(
      z.number().positive("Must be greater than 0"),
    ),
    exitPrice: optionalNumber,
    stopLoss: optionalNumber,
    targetPrice: optionalNumber,
    quantity: requiredNumber("Quantity is required").pipe(
      z.number().positive("Must be greater than 0"),
    ),
    multiplier: numberWithFallback(1).pipe(z.number().positive()),
    fees: numberWithFallback(0).pipe(z.number().min(0)),
    riskAmount: optionalNumber,
    rewardAmount: optionalNumber,

    entryAt: z.string().min(1, "Entry date is required"),
    exitAt: z.string().nullish(),

    setup: z.string().max(120).nullish(),
    emotion: z.enum(EMOTIONS).nullish(),
    confidence: optionalRating,
    executionRating: optionalRating,
    disciplineRating: optionalRating,
    grade: z.enum(GRADES).nullish(),
    lessons: z.string().nullish(),
    notes: z.string().nullish(),

    tagIds: z.array(z.string().uuid()).default([]),
    mistakeIds: z.array(z.string().uuid()).default([]),
  })
  .refine((d) => d.status !== "closed" || d.exitPrice != null, {
    message: "Exit price is required for a closed trade",
    path: ["exitPrice"],
  });

export type TradeFormValues = z.input<typeof tradeFormSchema>;
export type TradeFormOutput = z.output<typeof tradeFormSchema>;

export const tradeImageInputSchema = z.object({
  path: z.string().min(1),
  caption: z.string().nullish(),
});

export const bulkGradeSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  grade: z.enum(GRADES),
});

export const tradeCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(4000, "Comment is too long."),
  emotion: z.enum(EMOTIONS).nullish(),
});
export type TradeCommentInput = z.infer<typeof tradeCommentSchema>;

// Broker/CSV exports carry formatted numbers ("1,200.50", "$95", " 3 ").
// Strip currency/grouping noise before coercion so real values aren't dropped.
const cleanNumeric = (v: unknown) => {
  if (v == null || v === "") return undefined;
  const cleaned = typeof v === "string" ? v.replace(/[$£€,\s]/g, "") : v;
  return cleaned === "" ? undefined : cleaned;
};
const importNumber = z.preprocess(cleanNumeric, z.coerce.number());
const importOptionalNumber = z.preprocess(
  cleanNumeric,
  z.coerce.number().optional(),
);

// Accept the common broker synonyms for trade side.
const importDirection = z.preprocess((v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (["long", "buy", "b", "l", "bought"].includes(s)) return "long";
  if (["short", "sell", "s", "sold"].includes(s)) return "short";
  return s;
}, z.enum(DIRECTIONS));

const isParseableDate = (v: unknown) =>
  typeof v === "string" && !Number.isNaN(new Date(v).getTime());

export const importRowSchema = z.object({
  symbol: z.string().trim().min(1),
  market: z.enum(MARKETS).catch("stock"),
  direction: importDirection,
  status: z.enum(TRADE_STATUSES).catch("closed"),
  entry_price: importNumber.pipe(z.number().positive()),
  exit_price: importOptionalNumber,
  stop_loss: importOptionalNumber,
  target_price: importOptionalNumber,
  quantity: importNumber.pipe(z.number().positive()),
  fees: z
    .preprocess((v) => (v == null || v === "" ? 0 : cleanNumeric(v) ?? 0), z.coerce.number())
    .catch(0),
  // Reject unparseable dates instead of silently stamping the import time onto
  // the trade — a wrong timestamp corrupts calendar/analytics chronology.
  entry_at: z
    .string()
    .trim()
    .min(1, "Entry date is required")
    .refine(isParseableDate, "Invalid date"),
  exit_at: z.preprocess(
    emptyToUndefined,
    z.string().refine(isParseableDate, "Invalid date").optional(),
  ),
  setup: z.string().nullish(),
  notes: z.string().nullish(),
});

export type ImportRow = z.infer<typeof importRowSchema>;
