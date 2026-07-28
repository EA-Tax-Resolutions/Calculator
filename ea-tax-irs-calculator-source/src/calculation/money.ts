import Decimal from "decimal.js";

/**
 * All financial arithmetic in this application must go through this module.
 * Never use native JS number arithmetic for money or rates — binary floating
 * point cannot represent values like 0.005 or 0.0025 exactly, and errors
 * compound over hundreds of daily-interest steps.
 */

Decimal.set({
  precision: 50,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 30,
});

export type Money = Decimal & { readonly __brand: "Money" };
export type Rate = Decimal & { readonly __brand: "Rate" };

export function money(value: Decimal.Value): Money {
  return new Decimal(value) as Money;
}

export function rate(value: Decimal.Value): Rate {
  return new Decimal(value) as Rate;
}

export const ZERO = money(0);

export function add(...xs: Money[]): Money {
  return xs.reduce((sum, x) => money(sum.plus(x)), ZERO);
}

export function subtract(a: Money, b: Money): Money {
  return money(a.minus(b));
}

/** max(0, a - b) — the recurring "floor unpaid balance at zero" operation. */
export function subtractFloorZero(a: Money, b: Money): Money {
  const result = a.minus(b);
  return result.isNegative() ? ZERO : money(result);
}

export function multiplyRate(amount: Money, r: Rate): Money {
  return money(amount.times(r));
}

export function minMoney(a: Money, b: Money): Money {
  return money(Decimal.min(a, b));
}

export function maxMoney(a: Money, b: Money): Money {
  return money(Decimal.max(a, b));
}

export function isZero(a: Money): boolean {
  return a.isZero();
}

export function isZeroOrNegative(a: Money): boolean {
  return a.isZero() || a.isNegative();
}

export function isPositive(a: Money): boolean {
  return a.isPositive() && !a.isZero();
}

export function gt(a: Money, b: Money): boolean {
  return a.greaterThan(b);
}

export function gte(a: Money, b: Money): boolean {
  return a.greaterThanOrEqualTo(b);
}

export function lt(a: Money, b: Money): boolean {
  return a.lessThan(b);
}

/**
 * Round to cents ONLY at the final display boundary — never on
 * intermediate values. Accepts any Decimal (not just the branded Money
 * type) since display-layer call sites often hold an unbranded Decimal
 * after arithmetic like `.plus()` — the brand only matters for the
 * calculation engine's internal contracts, not for formatting.
 */
export function roundToCents(a: Decimal): Money {
  return money(a.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
}

export function toDisplayNumber(a: Decimal): number {
  return roundToCents(a).toNumber();
}

export function formatUSD(a: Decimal): string {
  const rounded = roundToCents(a);
  const negative = rounded.isNegative();
  const abs = rounded.abs().toFixed(2);
  const [whole, cents] = abs.split(".");
  const withCommas = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${withCommas}.${cents}`;
}
