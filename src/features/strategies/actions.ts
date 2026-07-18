"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

import { strategyFormSchema } from "./schemas";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

function toDbPayload(input: unknown, userId: string) {
  const parsed = strategyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid strategy.",
    };
  }
  const v = parsed.data;
  return {
    ok: true as const,
    payload: {
      user_id: userId,
      name: v.name,
      description: v.description ?? null,
      color: v.color ?? null,
      expected_rr: v.expectedRr ?? null,
      rules: v.rules.filter((r) => r.trim()),
      checklist: v.checklist
        .filter((c) => c.trim())
        .map((label) => ({ label })) as unknown as Json,
    },
  };
}

export async function createStrategyAction(input: unknown): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const res = toDbPayload(input, user.id);
  if (!res.ok) return { error: res.error };

  const { error } = await supabase.from("strategies").insert(res.payload);
  if (error) return { error: error.message };
  revalidatePath("/strategies");
  return { data: undefined };
}

export async function updateStrategyAction(
  id: string,
  input: unknown,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const res = toDbPayload(input, user.id);
  if (!res.ok) return { error: res.error };

  const { error } = await supabase
    .from("strategies")
    .update(res.payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/strategies");
  return { data: undefined };
}

export async function deleteStrategyAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("strategies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/strategies");
  return { data: undefined };
}
