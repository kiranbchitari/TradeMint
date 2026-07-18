import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Playbook } from "@/types/models";

export const getPlaybooks = cache(async (): Promise<Playbook[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbooks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
});
