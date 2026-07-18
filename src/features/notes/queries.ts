import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/types/models";

export const getNotes = cache(async (): Promise<Note[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export async function getNoteById(id: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}
