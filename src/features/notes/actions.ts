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
  const { error } = await supabase.from("notes").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { data: undefined };
}

export async function deleteNoteAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { data: undefined };
}
