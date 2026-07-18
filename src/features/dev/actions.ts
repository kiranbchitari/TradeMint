"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TradeInsert } from "@/types/models";

type Result = { data?: { count: number }; error?: string };

const SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "SPY", "QQQ", "META", "AMD", "GOOGL",
];
const SETUPS = [
  "Breakout retest", "VWAP reclaim", "Opening range", "Trend pullback",
  "Failed breakdown", "Gap fill",
];
const EMOTIONS = ["calm", "confident", "disciplined", "fearful", "greedy", "fomo"];
const GRADES = ["A", "B", "C", "D"];

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Seeds a realistic demo dataset for the current user (dev/testing aid).
 * No-op if the user already has trades.
 */
export async function seedDemoDataAction(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { count } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return { error: "You already have trades — demo seed skipped." };
  }

  const { data: broker } = await supabase
    .from("brokers")
    .insert({ user_id: user.id, name: "Demo Broker" })
    .select("id")
    .single();

  const { data: account } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      broker_id: broker?.id ?? null,
      name: "Main Account",
      currency: "USD",
      starting_balance: 25000,
      is_default: true,
    })
    .select("id")
    .single();

  const { data: strategies } = await supabase
    .from("strategies")
    .insert(
      ["Breakout", "Pullback", "Reversal", "Momentum"].map((name) => ({
        user_id: user.id,
        name,
      })),
    )
    .select("id");

  const { data: tags } = await supabase
    .from("tags")
    .insert(
      ["A+ setup", "news", "earnings", "scalp", "swing"].map((name) => ({
        user_id: user.id,
        name,
      })),
    )
    .select("id");

  const { data: mistakes } = await supabase
    .from("mistakes")
    .insert(
      ["FOMO entry", "Moved stop", "Oversized", "Early exit", "No plan"].map(
        (label) => ({ user_id: user.id, label }),
      ),
    )
    .select("id");

  const now = Date.now();
  const payloads: TradeInsert[] = [];
  for (let i = 0; i < 52; i++) {
    const daysAgo = randInt(0, 89);
    const entry = new Date(
      now - daysAgo * 86400000 - randInt(0, 6) * 3600000,
    );
    const exit = new Date(entry.getTime() + randInt(10, 480) * 60000);
    const dir = Math.random() > 0.45 ? "long" : "short";
    const entryPrice = +(50 + Math.random() * 400).toFixed(2);
    const win = Math.random() > 0.42;
    const magnitude = Math.random() * 0.05 + 0.005;
    const sign = (dir === "long" ? 1 : -1) * (win ? 1 : -1);
    const exitPrice = +(entryPrice * (1 + sign * magnitude)).toFixed(2);
    const risk = Math.random() * 0.02 + 0.008;
    const stop = +(
      dir === "long" ? entryPrice * (1 - risk) : entryPrice * (1 + risk)
    ).toFixed(2);
    const target = +(
      dir === "long" ? entryPrice * (1 + risk * 2.5) : entryPrice * (1 - risk * 2.5)
    ).toFixed(2);

    payloads.push({
      user_id: user.id,
      account_id: account?.id ?? null,
      broker_id: broker?.id ?? null,
      strategy_id: strategies?.length ? rand(strategies).id : null,
      symbol: rand(SYMBOLS),
      market: "stock",
      direction: dir,
      status: "closed",
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: stop,
      target_price: target,
      quantity: randInt(10, 300),
      multiplier: 1,
      fees: +(Math.random() * 6).toFixed(2),
      entry_at: entry.toISOString(),
      exit_at: exit.toISOString(),
      setup: rand(SETUPS),
      emotion: rand(EMOTIONS),
      confidence: randInt(2, 5),
      execution_rating: randInt(2, 5),
      discipline_rating: randInt(2, 5),
      grade: rand(GRADES),
      notes: win ? "Followed the plan and let it run." : "Entry was rushed.",
    });
  }

  const { data: inserted, error } = await supabase
    .from("trades")
    .insert(payloads)
    .select("id");
  if (error) return { error: error.message };

  // Attach random tags / mistakes.
  const tagLinks: { trade_id: string; tag_id: string; user_id: string }[] = [];
  const mistakeLinks: {
    trade_id: string;
    mistake_id: string;
    user_id: string;
  }[] = [];
  for (const t of inserted ?? []) {
    if (tags?.length && Math.random() > 0.4) {
      const n = randInt(1, 2);
      const picks = [...tags].sort(() => Math.random() - 0.5).slice(0, n);
      picks.forEach((tag) =>
        tagLinks.push({ trade_id: t.id, tag_id: tag.id, user_id: user.id }),
      );
    }
    if (mistakes?.length && Math.random() > 0.6) {
      mistakeLinks.push({
        trade_id: t.id,
        mistake_id: rand(mistakes).id,
        user_id: user.id,
      });
    }
  }
  if (tagLinks.length) await supabase.from("trade_tags").insert(tagLinks);
  if (mistakeLinks.length)
    await supabase.from("trade_mistakes").insert(mistakeLinks);

  await supabase.from("notes").insert([
    {
      user_id: user.id,
      title: "Trading plan",
      content:
        "# Trading plan\n\n- Risk max 1% per trade\n- Only trade A+ setups\n- No trades in the first 15 minutes",
      tags: ["plan"],
      is_pinned: true,
    },
    {
      user_id: user.id,
      title: "Weekly review",
      content:
        "Solid week. Discipline held up. Watch for FOMO entries on Fridays.",
      tags: ["review"],
    },
  ]);

  revalidatePath("/", "layout");
  return { data: { count: payloads.length } };
}
