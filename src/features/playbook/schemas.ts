import { z } from "zod";

export const playbookFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().nullish(),
  expectedRr: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().optional(),
  ),
  rules: z.array(z.string()),
  checklist: z.array(z.string()),
  tags: z.array(z.string()),
});

export type PlaybookFormValues = z.input<typeof playbookFormSchema>;
