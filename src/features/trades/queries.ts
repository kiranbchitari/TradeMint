import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  Trade,
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

/** All of the user's trades (flat rows), newest first. RLS scopes to the user. */
export const getTrades = cache(async (): Promise<Trade[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("entry_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

/** All trades with joined strategy/account/tags/mistakes/images. */
export const getTradesWithRelations = cache(
  async (): Promise<TradeWithRelations[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trades")
      .select(RELATIONS)
      .order("entry_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as RawTradeRow[]).map(mapTrade);
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

export async function getRecentTrades(limit = 5): Promise<TradeWithRelations[]> {
  const all = await getTradesWithRelations();
  return all.slice(0, limit);
}
