import type Decimal from "decimal.js";
import { formatUSD, roundToCents } from "@/calculation/money";
import type { PlainDate } from "@/calculation/dates";

export function formatMoney(amount: Decimal): string {
  return formatUSD(amount);
}

export function formatMoneyPlain(amount: Decimal): string {
  return roundToCents(amount).toFixed(2);
}

export function formatDate(date: PlainDate | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(date: PlainDate | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatPercent(rate: { toNumber: () => number }): string {
  return `${(rate.toNumber() * 100).toFixed(2)}%`;
}
