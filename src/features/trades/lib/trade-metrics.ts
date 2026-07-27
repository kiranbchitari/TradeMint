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
   *
   * Pass 0 when `entryPrice`/`exitPrice` are real fills — a buy fills at the ask
   * and exits at the bid, so the spread is already baked into those prices and
   * charging it here as well double-counts it. Supply it only when the prices
   * are mid/quoted, where the round turn costs one spread.
   */
  spreadPoints?: number;
  /**
   * Commission per lot, in account currency. Multiplied by `lotSize` and taken
   * at face value — whatever the caller reports is what gets charged.
   */
  commissionPerLot?: number;
  /**
   * Overnight holding fee, signed: positive is charged, negative is credited
   * (positive carry). Passed straight through to the fee total.
   */
  swapFee?: number;
};

export type TradeMetrics = {
  /** Margin the position ties up, or `null` when no leverage was supplied. */
  requiredMargin: number | null;
  /** Price move × contract value, before fees. */
  grossPnL: number;
  /** Spread + commission + swap. Negative when a swap credit exceeds the costs. */
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

  // Friction: the spread scales with contract value, commission with lots, and
  // swap is whatever the broker settled — signed, so positive carry credits back
  // instead of being charged twice.
  // A spread is a width, so its sign is meaningless — everything else is the
  // caller's reported figure, used as given.
  const totalFees =
    Math.abs(spreadPoints) * contractValue + commissionPerLot * lotSize + swapFee;

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
