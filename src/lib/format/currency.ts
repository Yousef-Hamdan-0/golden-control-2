import { BASE_CURRENCY, CURRENCY_SYMBOL } from "@/config/constants";

export type Currency = "SYP" | "USD";

const SYMBOL: Record<Currency, string> = {
  SYP: "ل.س",
  USD: "$",
};

/**
 * Format an amount for display. Defaults to the system base currency (SYP).
 * Matches the design: Latin grouping digits + currency symbol (e.g. "12,500 ل.س").
 * JOD is intentionally not supported — the system currency is the Syrian Lira.
 */
export function formatMoney(
  amount: number,
  currency: Currency = BASE_CURRENCY,
  opts: { decimals?: number } = {},
): string {
  const decimals = opts.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  const symbol = SYMBOL[currency] ?? CURRENCY_SYMBOL;
  // RTL: symbol trails the value, matching the salary fields in the design.
  return `${value} ${symbol}`;
}
