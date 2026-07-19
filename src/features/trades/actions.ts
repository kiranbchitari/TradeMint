"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { Database } from "@/types/database";
import type { TradeInsert } from "@/types/models";

import {
  bulkGradeSchema,
  importRowSchema,
  SHARE_ROLES,
  shareTradeSchema,
  tradeCommentSchema,
  tradeFormSchema,
  tradeImageInputSchema,
  type TradeFormOutput,
} from "./schemas";
import { z } from "zod";

type ActionResult<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

type DB = SupabaseClient<Database>;

// Upper bound on a single CSV import to avoid an unbounded memory/DB spike.
const MAX_IMPORT_ROWS = 5000;

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapToInsert(v: TradeFormOutput, userId: string): TradeInsert {
  return {
    user_id: userId,
    symbol: v.symbol.toUpperCase(),
    market: v.market,
    direction: v.direction,
    status: v.status,
    account_id: v.accountId ?? null,
    broker_id: v.brokerId ?? null,
    strategy_id: v.strategyId ?? null,
    entry_price: v.entryPrice,
    exit_price: v.exitPrice ?? null,
    stop_loss: v.stopLoss ?? null,
    target_price: v.targetPrice ?? null,
    quantity: v.quantity,
    multiplier: v.multiplier,
    fees: v.fees,
    risk_amount: v.riskAmount ?? null,
    reward_amount: v.rewardAmount ?? null,
    entry_at: toIso(v.entryAt) ?? new Date().toISOString(),
    exit_at: toIso(v.exitAt),
    setup: v.setup ?? null,
    emotion: v.emotion ?? null,
    confidence: v.confidence ?? null,
    execution_rating: v.executionRating ?? null,
    discipline_rating: v.disciplineRating ?? null,
    grade: v.grade ?? null,
    lessons: v.lessons ?? null,
    notes: v.notes ?? null,
  };
}

async function syncJunctions(
  supabase: DB,
  userId: string,
  tradeId: string,
  tagIds: string[],
  mistakeIds: string[],
) {
  await supabase.from("trade_tags").delete().eq("trade_id", tradeId);
  await supabase.from("trade_mistakes").delete().eq("trade_id", tradeId);

  if (tagIds.length > 0) {
    await supabase.from("trade_tags").insert(
      tagIds.map((tag_id) => ({ trade_id: tradeId, tag_id, user_id: userId })),
    );
  }
  if (mistakeIds.length > 0) {
    await supabase.from("trade_mistakes").insert(
      mistakeIds.map((mistake_id) => ({
        trade_id: tradeId,
        mistake_id,
        user_id: userId,
      })),
    );
  }
}

function revalidateTradeViews() {
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/trades");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
}

export async function createTradeAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = tradeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade data." };
  }

  const { data, error } = await supabase
    .from("trades")
    .insert(mapToInsert(parsed.data, user.id))
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not save trade." };

  await syncJunctions(
    supabase,
    user.id,
    data.id,
    parsed.data.tagIds,
    parsed.data.mistakeIds,
  );

  revalidateTradeViews();
  return { data: { id: data.id } };
}

export async function updateTradeAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = tradeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade data." };
  }

  // user_id is immutable on update (enforced by the trades_lock_owner trigger),
  // so don't send it — an editor collaborator must not rewrite ownership.
  const { user_id: _ownerId, ...patch } = mapToInsert(parsed.data, user.id);
  const { data: updated, error } = await supabase
    .from("trades")
    .update(patch)
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  // A stale session or a deleted/non-owned id matches zero rows; without this
  // check we'd report "Saved" while silently discarding the edit.
  if (!updated || updated.length === 0) {
    return { error: "That trade could not be found." };
  }

  await syncJunctions(
    supabase,
    user.id,
    id,
    parsed.data.tagIds,
    parsed.data.mistakeIds,
  );

  revalidateTradeViews();
  revalidatePath(`/trades/${id}`);
  return { data: { id } };
}

export async function addTradeImagesAction(
  tradeId: string,
  images: unknown,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = z.array(tradeImageInputSchema).safeParse(images);
  if (!parsed.success) return { error: "Invalid image data." };
  if (parsed.data.length === 0) return { data: undefined };

  const { error } = await supabase.from("trade_images").insert(
    parsed.data.map((img, i) => ({
      user_id: user.id,
      trade_id: tradeId,
      storage_path: img.path,
      caption: img.caption ?? null,
      sort: i,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function deleteTradeImageAction(
  imageId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: image } = await supabase
    .from("trade_images")
    .select("storage_path, trade_id")
    .eq("id", imageId)
    .maybeSingle();

  if (image) {
    await supabase.storage
      .from(STORAGE_BUCKETS.tradeImages)
      .remove([image.storage_path]);
  }

  const { error } = await supabase
    .from("trade_images")
    .delete()
    .eq("id", imageId);
  if (error) return { error: error.message };

  if (image?.trade_id) revalidatePath(`/trades/${image.trade_id}`);
  return { data: undefined };
}

export async function deleteTradeAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Remove associated images from storage first.
  const { data: images } = await supabase
    .from("trade_images")
    .select("storage_path")
    .eq("trade_id", id);
  if (images && images.length > 0) {
    await supabase.storage
      .from(STORAGE_BUCKETS.tradeImages)
      .remove(images.map((i) => i.storage_path));
  }

  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: undefined };
}

export async function bulkDeleteTradesAction(
  ids: string[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (ids.length === 0) return { data: undefined };

  // Remove associated images from storage first — the DB cascade only deletes
  // the `trade_images` rows, leaving the underlying blobs orphaned otherwise.
  const { data: images } = await supabase
    .from("trade_images")
    .select("storage_path")
    .in("trade_id", ids);
  if (images && images.length > 0) {
    await supabase.storage
      .from(STORAGE_BUCKETS.tradeImages)
      .remove(images.map((i) => i.storage_path));
  }

  const { error } = await supabase.from("trades").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: undefined };
}

export async function addTradeCommentAction(
  tradeId: string,
  input: unknown,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = tradeCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  const { error } = await supabase.from("trade_comments").insert({
    user_id: user.id,
    trade_id: tradeId,
    body: parsed.data.body,
    emotion: parsed.data.emotion ?? null,
    author_name: fullName,
    author_email: user.email ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function deleteTradeCommentAction(
  commentId: string,
  tradeId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("trade_comments")
    .delete()
    .eq("id", commentId);
  if (error) return { error: error.message };

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function shareTradeAction(
  tradeId: string,
  input: unknown,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = shareTradeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }

  const { data, error } = await supabase.rpc("share_trade", {
    p_trade_id: tradeId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) return { error: error.message };

  if (data !== "ok") {
    const messages: Record<string, string> = {
      not_owner: "Only the trade's owner can share it.",
      user_not_found: "No TradeMint user has that email address.",
      cannot_share_with_self: "You can't share a trade with yourself.",
      invalid_role: "Pick a valid access level.",
      unauthenticated: "You must be signed in.",
    };
    return { error: messages[data as string] ?? "Could not share the trade." };
  }

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function updateShareRoleAction(
  shareId: string,
  tradeId: string,
  role: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!SHARE_ROLES.includes(role as (typeof SHARE_ROLES)[number])) {
    return { error: "Pick a valid access level." };
  }

  // RLS (trade_shares_update) restricts this to the trade's owner.
  const { error } = await supabase
    .from("trade_shares")
    .update({ role })
    .eq("id", shareId);
  if (error) return { error: error.message };

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function removeShareAction(
  shareId: string,
  tradeId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS (trade_shares_delete) restricts this to the trade's owner.
  const { error } = await supabase
    .from("trade_shares")
    .delete()
    .eq("id", shareId);
  if (error) return { error: error.message };

  revalidatePath(`/trades/${tradeId}`);
  return { data: undefined };
}

export async function importTradesAction(
  rows: unknown,
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!Array.isArray(rows)) return { error: "Invalid import data." };
  if (rows.length === 0) return { error: "No rows to import." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      error: `Too many rows (${rows.length}). Import at most ${MAX_IMPORT_ROWS} at a time.`,
    };
  }

  // Validate row-by-row so one malformed row can't zero out the whole import.
  // Valid rows are inserted; invalid ones are counted and reported back.
  const payloads: TradeInsert[] = [];
  let skipped = 0;
  for (const raw of rows) {
    const parsed = importRowSchema.safeParse(raw);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const r = parsed.data;
    payloads.push({
      user_id: user.id,
      symbol: r.symbol.toUpperCase(),
      market: r.market,
      direction: r.direction,
      status: r.status,
      entry_price: r.entry_price,
      exit_price: r.exit_price ?? null,
      stop_loss: r.stop_loss ?? null,
      target_price: r.target_price ?? null,
      quantity: r.quantity,
      fees: r.fees ?? 0,
      // Schema guarantees a parseable date, so `toIso` won't fall back here.
      entry_at: toIso(r.entry_at) ?? new Date().toISOString(),
      exit_at: toIso(r.exit_at),
      setup: r.setup ?? null,
      notes: r.notes ?? null,
    });
  }

  if (payloads.length === 0) {
    return { error: "No valid rows to import. Check the required columns." };
  }

  const { error } = await supabase.from("trades").insert(payloads);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: { imported: payloads.length, skipped } };
}

export async function bulkGradeTradesAction(
  input: unknown,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = bulkGradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  const { error } = await supabase
    .from("trades")
    .update({ grade: parsed.data.grade })
    .in("id", parsed.data.ids);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: undefined };
}
