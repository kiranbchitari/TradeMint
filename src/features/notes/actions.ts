"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/types/models";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export async function createNoteAction(values: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<Result<Note>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: values.title.trim() || "Untitled",
      content: values.content,
      tags: values.tags ?? [],
    })
    .select("*")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create note." };

  revalidatePath("/notes");
  return { data };
}

export async function updateNoteAction(
  id: string,
  values: { title?: string; content?: string; tags?: string[]; is_pinned?: boolean },
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // `.select()` returns the affected rows so we can tell a real save from a
  // no-op (0 rows) — otherwise a lapsed session or a deleted note would report
  // "Saved" while silently discarding the user's edits.
  const { data, error } = await supabase
    .from("notes")
    .update(values)
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Note not found — it may have been deleted. Your changes were not saved." };
  }
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { data: undefined };
}

export async function deleteNoteAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { data: undefined };
}
