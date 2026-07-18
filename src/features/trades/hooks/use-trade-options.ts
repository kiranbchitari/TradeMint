"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export interface TradeOptions {
  strategies: { id: string; name: string; color: string | null }[];
  accounts: { id: string; name: string; currency: string }[];
  brokers: { id: string; name: string }[];
  tags: { id: string; name: string; color: string | null }[];
  mistakes: { id: string; label: string; color: string | null }[];
}

export const TRADE_OPTIONS_KEY = ["trade-options"] as const;

export function useTradeOptions() {
  return useQuery<TradeOptions>({
    queryKey: TRADE_OPTIONS_KEY,
    staleTime: 30_000,
    queryFn: async () => {
      const supabase = createClient();
      const [strategies, accounts, brokers, tags, mistakes] = await Promise.all([
        supabase
          .from("strategies")
          .select("id,name,color")
          .eq("is_archived", false)
          .order("name"),
        supabase
          .from("accounts")
          .select("id,name,currency")
          .eq("is_archived", false)
          .order("name"),
        supabase.from("brokers").select("id,name").order("name"),
        supabase.from("tags").select("id,name,color").order("name"),
        supabase.from("mistakes").select("id,label,color").order("label"),
      ]);

      return {
        strategies: strategies.data ?? [],
        accounts: accounts.data ?? [],
        brokers: brokers.data ?? [],
        tags: tags.data ?? [],
        mistakes: mistakes.data ?? [],
      };
    },
  });
}
