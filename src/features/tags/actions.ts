"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/types/models";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export async function createTagAction(
  name: string,
  color?: string | null,
): Promise<Result<Tag>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const clean = name.trim();
  if (!clean) return { error: "Tag name is required." };

  // Reuse an existing tag with the same name if present.
  const { data: existing } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", clean)
    .maybeSingle();
  if (existing) return { data: existing };

  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name: clean, color: color ?? null })
    .select("*")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create tag." };

  revalidatePath("/tags");
  return { data };
}

export async function updateTagAction(
  id: string,
  values: { name?: string; color?: string | null },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tags");
  return { data: undefined };
}

export async function deleteTagAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tags");
  return { data: undefined };
}
