import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

/** The authenticated user for the current request (deduped via React cache). */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The current user's profile row, or null if unauthenticated. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});

/** Convenience: the user's preferred display currency (defaults to USD). */
export const getUserCurrency = cache(async (): Promise<string> => {
  const profile = await getProfile();
  return profile?.currency ?? "USD";
});
