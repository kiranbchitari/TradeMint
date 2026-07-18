import {
  differenceInMilliseconds,
  format,
  getDay,
  getHours,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { Trade } from "@/types/models";

/** A closed trade guaranteed to have a realized P&L. */
export type ClosedTrade = Trade & { net_pnl: number };

export function getClosedTrades(trades: Trade[]): ClosedTrade[] {
  return trades.filter(
    (t): t is ClosedTrade => t.status === "closed" && t.net_pnl != null,
  );
}

export type TradeOutcome = "win" | "loss" | "breakeven";

export function outcomeOf(pnl: number): TradeOutcome {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

export interface KpiSummary {
  totalPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // 0–100
  grossProfit: number;
  grossLoss: number; // positive magnitude
  profitFactor: number | null;
  expectancy: number;
  avgWinner: number;
  avgLoser: number; // negative
  avgRR: number | null;
  largestWin: number;
  largestLoss: number; // negative
  currentStreak: number; // +n win streak / -n loss streak
  longestWinStreak: number;
  longestLossStreak: number;
  avgHoldingMs: number | null;
}

const EMPTY_KPIS: KpiSummary = {
  totalPnl: 0,
  totalTrades: 0,
  wins: 0,
  losses: 0,
  breakevens: 0,
  winRate: 0,
  grossProfit: 0,
  grossLoss: 0,
  profitFactor: null,
  expectancy: 0,
  avgWinner: 0,
  avgLoser: 0,
  avgRR: null,
  largestWin: 0,
  largestLoss: 0,
  currentStreak: 0,
  longestWinStreak: 0,
  longestLossStreak: 0,
  avgHoldingMs: null,
};

function sortByEntryAsc<T extends { entry_at: string }>(trades: T[]): T[] {
  return [...trades].sort(
    (a, b) => parseISO(a.entry_at).getTime() - parseISO(b.entry_at).getTime(),
  );
}

export function computeKpis(trades: Trade[]): KpiSummary {
  const closed = getClosedTrades(trades);
  if (closed.length === 0) return { ...EMPTY_KPIS };

  const ordered = sortByEntryAsc(closed);

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let rSum = 0;
  let rCount = 0;
  let holdingSum = 0;
  let holdingCount = 0;

  for (const t of ordered) {
    const pnl = t.net_pnl;
    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      largestWin = Math.max(largestWin, pnl);
    } else if (pnl < 0) {
      losses++;
      grossLoss += Math.abs(pnl);
      largestLoss = Math.min(largestLoss, pnl);
    } else {
      breakevens++;
    }

    if (t.r_multiple != null) {
      rSum += t.r_multiple;
      rCount++;
    }
    if (t.exit_at) {
      holdingSum += Math.abs(
        differenceInMilliseconds(parseISO(t.exit_at), parseISO(t.entry_at)),
      );
      holdingCount++;
    }
  }

  const totalTrades = ordered.length;
  const totalPnl = grossProfit - grossLoss;
  const decisive = wins + losses;

  // Streaks (chronological).
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let runWin = 0;
  let runLoss = 0;
  for (const t of ordered) {
    const o = outcomeOf(t.net_pnl);
    if (o === "win") {
      runWin++;
      runLoss = 0;
    } else if (o === "loss") {
      runLoss++;
      runWin = 0;
    } else {
      runWin = 0;
      runLoss = 0;
    }
    longestWinStreak = Math.max(longestWinStreak, runWin);
    longestLossStreak = Math.max(longestLossStreak, runLoss);
  }

  // Current streak from the most recent decisive trades.
  let currentStreak = 0;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const o = outcomeOf(ordered[i].net_pnl);
    if (o === "breakeven") break;
    const dir = o === "win" ? 1 : -1;
    if (currentStreak === 0) currentStreak = dir;
    else if (Math.sign(currentStreak) === dir) currentStreak += dir;
    else break;
  }

  return {
    totalPnl,
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    expectancy: totalTrades > 0 ? totalPnl / totalTrades : 0,
    avgWinner: wins > 0 ? grossProfit / wins : 0,
    avgLoser: losses > 0 ? -grossLoss / losses : 0,
    avgRR: rCount > 0 ? rSum / rCount : null,
    largestWin,
    largestLoss,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    avgHoldingMs: holdingCount > 0 ? holdingSum / holdingCount : null,
  };
}

/* ------------------------------------------------------------------ */
/* Time series                                                         */
/* ------------------------------------------------------------------ */

export interface EquityPoint {
  date: string; // ISO
  equity: number;
  pnl: number;
}

export function equityCurve(
  trades: Trade[],
  startingBalance = 0,
): EquityPoint[] {
  const closed = sortByEntryAsc(getClosedTrades(trades));
  let equity = startingBalance;
  return closed.map((t) => {
    equity += t.net_pnl;
    return { date: t.exit_at ?? t.entry_at, equity, pnl: t.net_pnl };
  });
}

export interface DrawdownPoint {
  date: string;
  drawdown: number; // <= 0 absolute
  drawdownPct: number; // <= 0 percent
}

export function drawdownSeries(equity: EquityPoint[]): DrawdownPoint[] {
  let peak = equity[0]?.equity ?? 0;
  return equity.map((p) => {
    peak = Math.max(peak, p.equity);
    const dd = p.equity - peak;
    return {
      date: p.date,
      drawdown: dd,
      drawdownPct: peak !== 0 ? (dd / Math.abs(peak)) * 100 : 0,
    };
  });
}

export function maxDrawdown(equity: EquityPoint[]): number {
  return drawdownSeries(equity).reduce((min, p) => Math.min(min, p.drawdown), 0);
}

/** Sum of realized P&L keyed by yyyy-MM-dd (uses exit date, else entry). */
export function pnlByDay(trades: Trade[]): Map<string, { pnl: number; count: number }> {
  const map = new Map<string, { pnl: number; count: number }>();
  for (const t of getClosedTrades(trades)) {
    const key = format(parseISO(t.exit_at ?? t.entry_at), "yyyy-MM-dd");
    const cur = map.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += t.net_pnl;
    cur.count += 1;
    map.set(key, cur);
  }
  return map;
}

export interface BucketPoint {
  key: string;
  label: string;
  pnl: number;
  trades: number;
  winRate: number;
}

function bucketBy(
  trades: Trade[],
  keyFn: (t: ClosedTrade) => { key: string; label: string; sort: number },
): BucketPoint[] {
  const groups = new Map<
    string,
    { label: string; sort: number; pnl: number; trades: number; wins: number }
  >();
  for (const t of getClosedTrades(trades)) {
    const { key, label, sort } = keyFn(t);
    const g = groups.get(key) ?? { label, sort, pnl: 0, trades: 0, wins: 0 };
    g.pnl += t.net_pnl;
    g.trades += 1;
    if (t.net_pnl > 0) g.wins += 1;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      pnl: g.pnl,
      trades: g.trades,
      winRate: g.trades > 0 ? (g.wins / g.trades) * 100 : 0,
      sort: g.sort,
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort: _sort, ...rest }) => rest);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function pnlByWeekday(trades: Trade[]): BucketPoint[] {
  return bucketBy(trades, (t) => {
    const d = getDay(parseISO(t.exit_at ?? t.entry_at));
    return { key: String(d), label: WEEKDAYS[d], sort: d };
  });
}

export function pnlByHour(trades: Trade[]): BucketPoint[] {
  return bucketBy(trades, (t) => {
    const h = getHours(parseISO(t.entry_at));
    return { key: String(h), label: `${h}:00`, sort: h };
  });
}

export function pnlByMonth(trades: Trade[]): BucketPoint[] {
  return bucketBy(trades, (t) => {
    const d = startOfMonth(parseISO(t.exit_at ?? t.entry_at));
    return {
      key: format(d, "yyyy-MM"),
      label: format(d, "MMM yyyy"),
      sort: d.getTime(),
    };
  });
}

export function pnlByWeek(trades: Trade[]): BucketPoint[] {
  return bucketBy(trades, (t) => {
    const d = startOfWeek(parseISO(t.exit_at ?? t.entry_at), {
      weekStartsOn: 1,
    });
    return {
      key: format(d, "yyyy-'W'II"),
      label: format(d, "MMM d"),
      sort: d.getTime(),
    };
  });
}

/** R-multiple distribution grouped into fixed buckets. */
export interface RBucket {
  label: string;
  count: number;
  from: number;
}

export function rMultipleDistribution(trades: Trade[]): RBucket[] {
  const edges = [-Infinity, -3, -2, -1, 0, 1, 2, 3, Infinity];
  const labels = [
    "≤ -3R",
    "-3 to -2R",
    "-2 to -1R",
    "-1 to 0R",
    "0 to 1R",
    "1 to 2R",
    "2 to 3R",
    "≥ 3R",
  ];
  const counts = new Array(labels.length).fill(0);
  for (const t of getClosedTrades(trades)) {
    if (t.r_multiple == null) continue;
    for (let i = 0; i < edges.length - 1; i++) {
      if (t.r_multiple >= edges[i] && t.r_multiple < edges[i + 1]) {
        counts[i]++;
        break;
      }
    }
  }
  return labels.map((label, i) => ({ label, count: counts[i], from: edges[i] }));
}
