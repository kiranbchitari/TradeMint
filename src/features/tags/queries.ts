import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/types/models";

export const getTags = cache(async (): Promise<Tag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export async function getTagUsage(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("trade_tags").select("tag_id");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;
  });
  return counts;
}
