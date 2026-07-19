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
  const counts: Record<string, number> = {};
  // Page past the 1000-row cap so usage counts are correct for heavy users,
  // and surface errors instead of silently reporting every tag as "0 uses".
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("trade_tags")
      .select("tag_id")
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;
    if (data.length < 1000) break;
  }
  return counts;
}
