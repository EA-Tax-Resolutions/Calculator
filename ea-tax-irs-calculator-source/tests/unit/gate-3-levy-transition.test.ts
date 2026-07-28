import { describe, it, expect } from "vitest";
import { calculateFailureToPayPenalty } from "@/calculation/failureToPay";
import { buildTaxPrincipalCurve } from "@/calculation/paymentLedger";
import { usd, d } from "./helpers";

/**
 * Required official IRM regression example (off-by-one guard):
 * Original payment due date April 15, notice of intent to levy July 10.
 * Penalty months begin on the 16th. The 10-day statutory period elapses
 * July 20. July's block already started July 16 (before the threshold),
 * so it stays at the standard rate. The first 1% block must be the one
 * starting August 16, NOT July 16.
 */
describe("Gate 3: levy-notice 1% rate transition (off-by-one guard)", () => {
  it("applies the 1% rate starting August 16, not July 16", () => {
    const capBase = usd(10000);
    const { curve } = buildTaxPrincipalCurve(capBase, []); // no payments; balance stays at capBase throughout

    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-09-01"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
      levyNoticeDate: d("2022-07-10"),
    });

    expect(result.monthlyBreakdown).toHaveLength(5);

    const [m1, m2, m3, m4, m5] = result.monthlyBreakdown;
    expect(m1?.start.toString()).toBe("2022-04-16");
    expect(m1?.rateReason).toBe("standard");
    expect(m2?.rateReason).toBe("standard");
    expect(m3?.rateReason).toBe("standard");

    // July's block: starts July 16, before the July 20 threshold -> still standard.
    expect(m4?.start.toString()).toBe("2022-07-16");
    expect(m4?.end.toString()).toBe("2022-08-15");
    expect(m4?.rateReason).toBe("standard");
    expect(m4?.rate.toFixed(4)).toBe("0.0050");

    // August's block: starts August 16, on/after the July 20 threshold -> first 1% block.
    expect(m5?.start.toString()).toBe("2022-08-16");
    expect(m5?.rateReason).toBe("levy_notice");
    expect(m5?.rate.toFixed(4)).toBe("0.0100");
  });

  it("does NOT apply the 1% rate to the block merely containing the threshold date (naive off-by-one)", () => {
    const capBase = usd(10000);
    const { curve } = buildTaxPrincipalCurve(capBase, []);

    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-07-20"), // exactly the threshold date, still inside July's block
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
      levyNoticeDate: d("2022-07-10"),
    });

    const last = result.monthlyBreakdown[result.monthlyBreakdown.length - 1];
    expect(last?.rateReason).toBe("standard");
  });
});
