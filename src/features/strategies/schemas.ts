import { z } from "zod";

export const strategyFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().nullish(),
  color: z.string().nullish(),
  expectedRr: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().optional(),
  ),
  rules: z.array(z.string()),
  checklist: z.array(z.string()),
});

export type StrategyFormValues = z.input<typeof strategyFormSchema>;
export type StrategyFormOutput = z.output<typeof strategyFormSchema>;

export const ENTITY_COLORS = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
];
