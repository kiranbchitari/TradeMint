"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfileAction(values: {
  full_name?: string;
  currency?: string;
  timezone?: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data: undefined };
}

export async function updateRiskSettingsAction(
  risk_settings: Json,
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("profiles")
    .update({ risk_settings })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

export async function updatePreferencesAction(
  preferences: Json,
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("profiles")
    .update({ preferences })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

export async function createBrokerAction(name: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };
  if (!name.trim()) return { error: "Broker name is required." };
  const { error } = await supabase
    .from("brokers")
    .insert({ user_id: user.id, name: name.trim() });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

export async function deleteBrokerAction(id: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("brokers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

export async function createAccountAction(values: {
  name: string;
  currency: string;
  starting_balance: number;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };
  if (!values.name.trim()) return { error: "Account name is required." };
  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: values.name.trim(),
    currency: values.currency,
    starting_balance: values.starting_balance,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

export async function deleteAccountRecordAction(id: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: undefined };
}

/** Danger zone: wipe all of the user's trading data (keeps the account). */
export async function deleteAllDataAction(): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const tables = [
    "trades",
    "strategies",
    "playbooks",
    "notes",
    "tags",
    "mistakes",
    "brokers",
    "accounts",
    "reports",
    "sessions",
    "notifications",
  ] as const;

  for (const table of tables) {
    await supabase.from(table).delete().eq("user_id", user.id);
  }

  revalidatePath("/", "layout");
  return { data: undefined };
}
