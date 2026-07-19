import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  SharedTrade,
  Trade,
  TradeAccess,
  TradeComment,
  TradeImage,
  TradeShare,
  ShareRole,
  TradeWithRelations,
} from "@/types/models";

const RELATIONS = `
  *,
  strategy:strategies(id,name,color),
  account:accounts(id,name,currency),
  images:trade_images(*),
  trade_tags(tag:tags(id,name,color)),
  trade_mistakes(mistake:mistakes(id,label,color))
`;

type RawTradeRow = Trade & {
  strategy: { id: string; name: string; color: string | null } | null;
  account: { id: string; name: string; currency: string } | null;
  images: TradeImage[] | null;
  trade_tags: { tag: { id: string; name: string; color: string | null } | null }[] | null;
  trade_mistakes:
    | { mistake: { id: string; label: string; color: string | null } | null }[]
    | null;
};

function mapTrade(row: RawTradeRow): TradeWithRelations {
  const { trade_tags, trade_mistakes, images, ...rest } = row;
  return {
    ...rest,
    strategy: row.strategy,
    account: row.account,
    images: (images ?? []).sort((a, b) => a.sort - b.sort),
    tags: (trade_tags ?? []).map((t) => t.tag).filter((t) => t != null),
    mistakes: (trade_mistakes ?? []).map((m) => m.mistake).filter((m) => m != null),
  };
}

// Supabase caps a single `.select()` at 1000 rows. A trading journal can hold
// far more, and every analytic (total P&L, equity curve, win rate, drawdown…)
// must be computed over the user's FULL history — a silent 1000-row truncation
// would make the headline numbers wrong. So we page through with `.range()`.
// A stable secondary sort on `id` guarantees no row is skipped or duplicated
// across page boundaries when many trades share the same `entry_at`.
const PAGE_SIZE = 1000;

/**
 * The signed-in user's id. Trades shared *with* the user are now visible under
 * RLS, so owner-facing list queries must filter by owner explicitly — otherwise
 * a shared trade would leak into the owner's dashboard/journal/analytics.
 */
const currentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

/** The signed-in user's id (or null), for gating collaborative UI. */
export const getCurrentUserId = currentUserId;

/** All of the user's OWNED trades (flat rows), newest first. */
export const getTrades = cache(async (): Promise<Trade[]> => {
  const supabase = await createClient();
  const uid = await currentUserId();
  if (!uid) return [];
  const all: Trade[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", uid)
      .order("entry_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return all;
});

/** All OWNED trades with joined strategy/account/tags/mistakes/images. */
export const getTradesWithRelations = cache(
  async (): Promise<TradeWithRelations[]> => {
    const supabase = await createClient();
    const uid = await currentUserId();
    if (!uid) return [];
    const rows: RawTradeRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("trades")
        .select(RELATIONS)
        .eq("user_id", uid)
        .order("entry_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...(data as unknown as RawTradeRow[]));
      if (data.length < PAGE_SIZE) break;
    }
    return rows.map(mapTrade);
  },
);

export async function getTradeById(
  id: string,
): Promise<TradeWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(RELATIONS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTrade(data as unknown as RawTradeRow) : null;
}

/** Trades shared *with* the current user (not owned by them), newest first. */
export async function getSharedTrades(): Promise<SharedTrade[]> {
  const supabase = await createClient();
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("trade_shares")
    .select("role, created_at, owner_name, owner_email, trade:trades(*)")
    .eq("collaborator_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((r) => r.trade != null)
    .map((r) => ({
      trade: r.trade as unknown as Trade,
      role: r.role as ShareRole,
      ownerName: r.owner_name,
      ownerEmail: r.owner_email,
      sharedAt: r.created_at,
    }));
}

/** The collaborators on a trade (owner-facing share list). */
export async function getTradeShares(tradeId: string): Promise<TradeShare[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trade_shares")
    .select("*")
    .eq("trade_id", tradeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** The signed-in user's relationship to a trade, used to gate the detail UI. */
export async function getTradeAccess(trade: Trade): Promise<TradeAccess> {
  const uid = await currentUserId();
  if (!uid) return { isOwner: false, role: null };
  if (trade.user_id === uid) return { isOwner: true, role: "owner" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("trade_shares")
    .select("role")
    .eq("trade_id", trade.id)
    .eq("collaborator_id", uid)
    .maybeSingle();
  return { isOwner: false, role: (data?.role as ShareRole) ?? null };
}

/**
 * A trade's commentary feed, oldest first so it reads as a timeline. Kept out
 * of the shared RELATIONS join so list views (which page over every trade)
 * stay lean — the detail page fetches this on demand. RLS scopes to the user.
 */
export async function getTradeComments(
  tradeId: string,
): Promise<TradeComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trade_comments")
    .select("*")
    .eq("trade_id", tradeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
