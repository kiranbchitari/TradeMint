/**
 * Trade metrics — gross P&L, trading friction (fees) and required margin for a
 * single position.
 *
 * Contract sizes differ per instrument: one lot of gold (XAUUSD) controls 100
 * troy ounces, while one lot of BTCUSD controls 1 coin. Every money figure here
 * is therefore `price × contract multiplier × lot size`, and the multiplier is
 * resolved from the symbol unless the caller passes one explicitly.
 */

/**
 * Contract size per lot, keyed by uppercased symbol. Symbols outside this table
 * need an explicit `contractMultiplier` — guessing one would silently mis-scale
 * every figure below.
 */
const CONTRACT_MULTIPLIERS: Record<string, number> = {
  XAUUSD: 100,
  GOLD: 100,
  BTCUSD: 1,
  BITCOIN: 1,
};

/** Broker/platform synonyms for the two sides of a trade. */
const LONG_SIDES = ["buy", "long"];
const SHORT_SIDES = ["sell", "short"];

export type TradeMetricsInput = {
  /** Instrument symbol, e.g. "XAUUSD" or "BTCUSD" (case-insensitive). */
  symbol: string;
  /** "buy"/"long" or "sell"/"short" (case-insensitive). */
  direction: string;
  /** Execution entry price. */
  entryPrice: number;
  /** Execution exit price. */
  exitPrice: number;
  /** Trading volume in lots. */
  lotSize: number;
  /**
   * Account leverage ratio (e.g. 100 for 1:100). Omit when unknown —
   * `requiredMargin` then comes back as `null` rather than a bogus number.
   */
  leverage?: number;
  /**
   * Contract size per lot. Overrides the symbol lookup; required for symbols
   * the lookup doesn't know.
   */
  contractMultiplier?: number;
  /**
   * Platform spread in the instrument's price units (0.50 = 50 cents on gold,
   * 15 = $15 on BTC), not in fractional pips.
   */
  spreadPoints?: number;
  /** Fixed fee per standard round lot, in account currency. */
  commissionPerLot?: number;
  /** Total overnight holding fee. Treated as a cost; the sign is ignored. */
  swapFee?: number;
};

export type TradeMetrics = {
  /** Margin the position ties up, or `null` when no leverage was supplied. */
  requiredMargin: number | null;
  /** Price move × contract value, before fees. */
  grossPnL: number;
  /** Spread + commission + swap. */
  totalFees: number;
  /** Gross P&L less fees — what actually hits the account. */
  netPnL: number;
};

/**
 * Contract size per lot for a known symbol, or `null` if it isn't in the table.
 */
export function contractMultiplierFor(symbol: string): number | null {
  return CONTRACT_MULTIPLIERS[symbol.trim().toUpperCase()] ?? null;
}

/**
 * Complete metrics for one round-trip trade, each figure rounded to 2 decimals.
 *
 * Throws when the inputs can't produce a meaningful result: an unknown symbol
 * with no `contractMultiplier`, an unrecognised direction, or a non-positive
 * price/size/multiplier.
 */
export function calculateTradeMetrics(input: TradeMetricsInput): TradeMetrics {
  const {
    symbol,
    direction,
    entryPrice,
    exitPrice,
    lotSize,
    leverage,
    contractMultiplier,
    spreadPoints = 0,
    commissionPerLot = 0,
    swapFee = 0,
  } = input;

  const multiplier = contractMultiplier ?? contractMultiplierFor(symbol);
  if (multiplier == null) {
    throw new Error(
      `Unsupported symbol: ${symbol}. Pass contractMultiplier explicitly.`,
    );
  }

  const side = direction.trim().toLowerCase();
  const directionModifier = LONG_SIDES.includes(side)
    ? 1
    : SHORT_SIDES.includes(side)
      ? -1
      : null;
  if (directionModifier == null) {
    throw new Error(`Unsupported direction: ${direction}`);
  }

  requirePositive(multiplier, "contractMultiplier");
  requirePositive(entryPrice, "entryPrice");
  requirePositive(exitPrice, "exitPrice");
  requirePositive(lotSize, "lotSize");

  // Notional value is what the multiplier scales everything to: the account
  // posts a fraction of it as margin, and P&L moves with it 1:1.
  const contractValue = multiplier * lotSize;
  const requiredMargin =
    leverage != null && Number.isFinite(leverage) && leverage > 0
      ? (entryPrice * contractValue) / leverage
      : null;

  const grossPnL = (exitPrice - entryPrice) * contractValue * directionModifier;

  // Friction: crossing the spread costs the same on any size, commission scales
  // per lot, swap is whatever the broker charged for holding overnight.
  const totalFees =
    Math.abs(spreadPoints) * contractValue +
    Math.abs(commissionPerLot) * lotSize +
    Math.abs(swapFee);

  return {
    requiredMargin: requiredMargin == null ? null : round2(requiredMargin),
    grossPnL: round2(grossPnL),
    totalFees: round2(totalFees),
    netPnL: round2(grossPnL - totalFees),
  };
}

function requirePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number, got ${value}`);
  }
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}
