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
    multiplier: z
      .preprocess(emptyToUndefined, z.coerce.number().positive())
      .default(1),
    fees: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
    riskAmount: optionalNumber,
    rewardAmount: optionalNumber,

    entryAt: z.string().min(1, "Entry date is required"),
    exitAt: z.string().nullish(),

    setup: z.string().max(120).nullish(),
    emotion: z.enum(EMOTIONS).nullish(),
    confidence: optionalNumber,
    executionRating: optionalNumber,
    disciplineRating: optionalNumber,
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

export const importRowSchema = z.object({
  symbol: z.string().trim().min(1),
  market: z.enum(MARKETS).catch("stock"),
  direction: z.enum(DIRECTIONS),
  status: z.enum(TRADE_STATUSES).catch("closed"),
  entry_price: z.coerce.number(),
  exit_price: optionalNumber,
  stop_loss: optionalNumber,
  target_price: optionalNumber,
  quantity: z.coerce.number().positive(),
  fees: z.preprocess(emptyToUndefined, z.coerce.number()).catch(0),
  entry_at: z.string().min(1),
  exit_at: z.string().nullish(),
  setup: z.string().nullish(),
  notes: z.string().nullish(),
});

export type ImportRow = z.infer<typeof importRowSchema>;
