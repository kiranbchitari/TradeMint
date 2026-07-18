/**
 * Planned reward-to-risk ratio from a trade's entry, stop and target.
 * Direction-agnostic: uses absolute distances, so it works for longs
 * (stop below, target above) and shorts (stop above, target below).
 *
 * Returns reward-per-unit ÷ risk-per-unit, or null when it can't be
 * computed (missing stop/target, or a zero-width stop).
 */
export function plannedRiskReward(
  entryPrice: unknown,
  stopLoss: unknown,
  targetPrice: unknown,
): number | null {
  const entry = toNumber(entryPrice);
  const stop = toNumber(stopLoss);
  const target = toNumber(targetPrice);
  if (entry == null || stop == null || target == null) return null;

  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  if (risk <= 0) return null;

  return reward / risk;
}

/** Format a reward-to-risk ratio as "1 : 2.50". */
export function formatRiskReward(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `1 : ${ratio.toFixed(2)}`;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
