import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { computeCompoundInterestOverSegments } from "@/calculation/interest";
import { buildCurveFromSteps } from "@/calculation/paymentLedger";
import { rate } from "@/calculation/money";
import { usd, d } from "./helpers";

describe("Gate 6: quarter-boundary and leap-year interest", () => {
  it("splits into separate segments at a quarterly rate change (2022 Q1 3% -> Q2 4%)", () => {
    const curve = buildCurveFromSteps(usd(10000), []);
    const result = computeCompoundInterestOverSegments({
      curve,
      accrualStartDate: d("2022-03-25"),
      calcThroughDate: d("2022-04-05"),
    });

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]?.start.toString()).toBe("2022-03-25");
    expect(result.segments[0]?.end.toString()).toBe("2022-03-31");
    expect(result.segments[0]?.annualRate.toFixed(2)).toBe("0.03");
    expect(result.segments[1]?.start.toString()).toBe("2022-04-01");
    expect(result.segments[1]?.end.toString()).toBe("2022-04-05");
    expect(result.segments[1]?.annualRate.toFixed(2)).toBe("0.04");

    // Total must fall strictly between "flat 3% the whole time" and "flat 4% the whole time".
    const days = 12;
    const flat3 = new Decimal(10000).times(new Decimal(1).plus(new Decimal("0.03").dividedBy(365)).pow(days).minus(1));
    const flat4 = new Decimal(10000).times(new Decimal(1).plus(new Decimal("0.04").dividedBy(365)).pow(days).minus(1));
    expect(result.totalInterest.greaterThan(flat3)).toBe(true);
    expect(result.totalInterest.lessThan(flat4)).toBe(true);
  });

  it("uses a 366-day divisor for a full leap year (2024), not 365", () => {
    const curve = buildCurveFromSteps(usd(10000), []);
    const result = computeCompoundInterestOverSegments({
      curve,
      accrualStartDate: d("2024-01-01"),
      calcThroughDate: d("2024-12-31"),
    });

    // 2024's rate is a flat 8% for all four quarters, isolating the
    // leap-year day-count effect from any rate-change noise.
    const dailyRate366 = new Decimal("0.08").dividedBy(366);
    const expected = new Decimal(10000).times(new Decimal(1).plus(dailyRate366).pow(366).minus(1));

    expect(result.totalInterest.toFixed(2)).toBe(expected.toFixed(2));

    // A (deliberately wrong) 365-day divisor must NOT match — proves the
    // leap-year convention is actually being applied, not defaulted to 365.
    const dailyRate365 = new Decimal("0.08").dividedBy(365);
    const wrongIfNonLeap = new Decimal(10000).times(new Decimal(1).plus(dailyRate365).pow(366).minus(1));
    expect(result.totalInterest.toFixed(2)).not.toBe(wrongIfNonLeap.toFixed(2));
  });

  it("stops accruing and flags the cutoff once the calculation-through date exceeds the last verified quarter", () => {
    const curve = buildCurveFromSteps(usd(10000), []);
    const result = computeCompoundInterestOverSegments({
      curve,
      accrualStartDate: d("2026-09-01"),
      calcThroughDate: d("2027-03-01"), // past Q3 2026, the last verified row
    });

    expect(result.rateTableExceeded).toBe(true);
    expect(result.exceededAtDate?.toString()).toBe("2026-10-01");
    // No segment beyond the verified cutoff without an explicit manual override.
    for (const seg of result.segments) {
      expect(seg.verified).toBe(true);
    }
  });

  it("accepts a manual override rate for the period beyond the verified table, clearly marked unverified", () => {
    const curve = buildCurveFromSteps(usd(10000), []);
    const result = computeCompoundInterestOverSegments({
      curve,
      accrualStartDate: d("2026-09-01"),
      calcThroughDate: d("2026-10-15"),
      manualOverrideRate: rate("0.07"),
    });

    expect(result.rateTableExceeded).toBe(true);
    const unverifiedSegments = result.segments.filter((s) => !s.verified);
    expect(unverifiedSegments.length).toBeGreaterThan(0);
    expect(result.totalInterest.greaterThan(0)).toBe(true);
  });
});
