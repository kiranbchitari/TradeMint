import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  Trade,
  TradeComment,
  TradeImage,
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

/** All of the user's trades (flat rows), newest first. RLS scopes to the user. */
export const getTrades = cache(async (): Promise<Trade[]> => {
  const supabase = await createClient();
  const all: Trade[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
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

/** All trades with joined strategy/account/tags/mistakes/images. */
export const getTradesWithRelations = cache(
  async (): Promise<TradeWithRelations[]> => {
    const supabase = await createClient();
    const rows: RawTradeRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("trades")
        .select(RELATIONS)
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
