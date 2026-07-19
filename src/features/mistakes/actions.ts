"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Mistake } from "@/types/models";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export async function createMistakeAction(
  label: string,
  color?: string | null,
): Promise<Result<Mistake>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const clean = label.trim();
  if (!clean) return { error: "Mistake label is required." };

  const { data: existing } = await supabase
    .from("mistakes")
    .select("*")
    .eq("user_id", user.id)
    .ilike("label", clean)
    .maybeSingle();
  if (existing) return { data: existing };

  const { data, error } = await supabase
    .from("mistakes")
    .insert({ user_id: user.id, label: clean, color: color ?? null })
    .select("*")
    .single();
  if (error || !data)
    return { error: error?.message ?? "Could not create mistake." };

  revalidatePath("/settings");
  return { data };
}

export async function deleteMistakeAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("mistakes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}
