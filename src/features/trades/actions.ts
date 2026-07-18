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
  tradeFormSchema,
  tradeImageInputSchema,
  type TradeFormOutput,
} from "./schemas";
import { z } from "zod";

type ActionResult<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

type DB = SupabaseClient<Database>;

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
    exit_price: v.status === "closed" ? (v.exitPrice ?? null) : (v.exitPrice ?? null),
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

  const { error } = await supabase
    .from("trades")
    .update(mapToInsert(parsed.data, user.id))
    .eq("id", id);

  if (error) return { error: error.message };

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

  const { error } = await supabase.from("trades").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: undefined };
}

export async function importTradesAction(
  rows: unknown,
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = z.array(importRowSchema).safeParse(rows);
  if (!parsed.success) {
    return { error: "Some rows are invalid. Check required columns." };
  }
  if (parsed.data.length === 0) return { error: "No rows to import." };

  const payloads: TradeInsert[] = parsed.data.map((r) => ({
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
    entry_at: toIso(r.entry_at) ?? new Date().toISOString(),
    exit_at: toIso(r.exit_at),
    setup: r.setup ?? null,
    notes: r.notes ?? null,
  }));

  const { error } = await supabase.from("trades").insert(payloads);
  if (error) return { error: error.message };

  revalidateTradeViews();
  return { data: { count: payloads.length } };
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
