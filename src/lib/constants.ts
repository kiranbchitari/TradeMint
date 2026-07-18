export const APP_NAME = "TradeMint";
export const APP_DESCRIPTION =
  "A premium trading journal to log trades, review performance, and build discipline.";

/* ------------------------------------------------------------------ */
/* Domain enums — kept in sync with the database CHECK constraints.    */
/* ------------------------------------------------------------------ */

export const MARKETS = [
  "stock",
  "future",
  "option",
  "forex",
  "crypto",
] as const;
export type Market = (typeof MARKETS)[number];
export const MARKET_LABELS: Record<Market, string> = {
  stock: "Stock",
  future: "Future",
  option: "Option",
  forex: "Forex",
  crypto: "Crypto",
};

export const DIRECTIONS = ["long", "short"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DIRECTION_LABELS: Record<Direction, string> = {
  long: "Long",
  short: "Short",
};

export const TRADE_STATUSES = ["open", "closed", "cancelled"] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];
export const TRADE_STATUS_LABELS: Record<TradeStatus, string> = {
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

/** Outcome is derived from net P&L on closed trades. */
export const OUTCOMES = ["win", "loss", "breakeven"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const EMOTIONS = [
  "calm",
  "confident",
  "disciplined",
  "excited",
  "fearful",
  "greedy",
  "fomo",
  "revenge",
  "frustrated",
  "bored",
] as const;
export type Emotion = (typeof EMOTIONS)[number];
export const EMOTION_LABELS: Record<Emotion, string> = {
  calm: "Calm",
  confident: "Confident",
  disciplined: "Disciplined",
  excited: "Excited",
  fearful: "Fearful",
  greedy: "Greedy",
  fomo: "FOMO",
  revenge: "Revenge",
  frustrated: "Frustrated",
  bored: "Bored",
};

export const GRADES = ["A", "B", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

/** 1–5 rating scale used for confidence / execution / discipline. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "AUD",
  "CAD",
] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

/* Storage bucket names */
export const STORAGE_BUCKETS = {
  tradeImages: "trade-images",
  avatars: "avatars",
} as const;
