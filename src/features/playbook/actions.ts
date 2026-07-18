"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

import { playbookFormSchema } from "./schemas";

type Result<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

function toDbPayload(input: unknown, userId: string) {
  const parsed = playbookFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid playbook.",
    };
  }
  const v = parsed.data;
  return {
    ok: true as const,
    payload: {
      user_id: userId,
      title: v.title,
      description: v.description ?? null,
      expected_rr: v.expectedRr ?? null,
      rules: v.rules.filter((r) => r.trim()),
      checklist: v.checklist
        .filter((c) => c.trim())
        .map((label) => ({ label })) as unknown as Json,
      tags: v.tags.filter((t) => t.trim()),
    },
  };
}

export async function createPlaybookAction(input: unknown): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const res = toDbPayload(input, user.id);
  if (!res.ok) return { error: res.error };
  const { error } = await supabase.from("playbooks").insert(res.payload);
  if (error) return { error: error.message };
  revalidatePath("/playbook");
  return { data: undefined };
}

export async function updatePlaybookAction(
  id: string,
  input: unknown,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const res = toDbPayload(input, user.id);
  if (!res.ok) return { error: res.error };
  const { error } = await supabase
    .from("playbooks")
    .update(res.payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/playbook");
  return { data: undefined };
}

export async function deletePlaybookAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("playbooks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/playbook");
  return { data: undefined };
}
