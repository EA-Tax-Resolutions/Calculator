import { describe, it, expect } from "vitest";
import { computeFtpPenaltyInterest } from "@/calculation/interest";
import { buildCurveFromSteps } from "@/calculation/paymentLedger";
import { usd, d } from "./helpers";

/**
 * Corrected rule: a notice-and-demand date alone does not trigger interest
 * on the failure-to-pay penalty. IRC 6601(e): no interest if the penalty
 * is paid within 21 calendar days of notice and demand (10 business days
 * if the amount stated in the notice is >= $100,000).
 */
describe("Gate 4: failure-to-pay penalty interest grace period (IRC 6601(e))", () => {
  it("imposes no interest when the FTP penalty is paid within the 21-day grace period", () => {
    const curve = buildCurveFromSteps(usd(65), [{ date: d("2022-07-15"), remainingAfter: usd(0) }]);

    const outcome = computeFtpPenaltyInterest({
      noticeAndDemandDate: d("2022-07-01"),
      ftpPenaltyCurve: curve,
      calculationThroughDate: d("2022-08-01"),
    });

    expect(outcome.gracePeriodMet).toBe(true);
    expect("omitted" in outcome.result).toBe(false);
    if (!("omitted" in outcome.result)) {
      expect(outcome.result.totalInterest.toFixed(2)).toBe("0.00");
    }
  });

  it("accrues interest starting from the notice-and-demand date when NOT paid within the grace period", () => {
    const curve = buildCurveFromSteps(usd(65), []); // never paid down

    const outcome = computeFtpPenaltyInterest({
      noticeAndDemandDate: d("2022-07-01"),
      ftpPenaltyCurve: curve,
      calculationThroughDate: d("2022-08-01"),
    });

    expect(outcome.gracePeriodMet).toBe(false);
    expect("omitted" in outcome.result).toBe(false);
    if (!("omitted" in outcome.result)) {
      expect(outcome.result.totalInterest.greaterThan(0)).toBe(true);
      expect(outcome.result.segments[0]?.start.toString()).toBe("2022-07-01");
    }
  });

  it("uses the 10-business-day threshold (not 21 calendar days) when the notice amount is $100,000 or more", () => {
    // Notice date 2022-07-01 (Friday): 10 business days -> 2022-07-15.
    // 21 calendar days -> 2022-07-22. A payment on 2022-07-18 satisfies the
    // 21-calendar-day reading but NOT the 10-business-day reading.
    const curve = buildCurveFromSteps(usd(150000), [{ date: d("2022-07-18"), remainingAfter: usd(0) }]);

    const outcome = computeFtpPenaltyInterest({
      noticeAndDemandDate: d("2022-07-01"),
      ftpPenaltyCurve: curve,
      calculationThroughDate: d("2022-08-01"),
    });

    expect(outcome.graceDeadline?.toString()).toBe("2022-07-15");
    expect(outcome.gracePeriodMet).toBe(false); // paid Jul 18, after the Jul 15 business-day deadline
    expect("omitted" in outcome.result).toBe(false);
    if (!("omitted" in outcome.result)) {
      expect(outcome.result.totalInterest.greaterThan(0)).toBe(true);
    }
  });

  it("omits FTP-penalty interest entirely when no notice-and-demand date is supplied", () => {
    const curve = buildCurveFromSteps(usd(65), []);
    const outcome = computeFtpPenaltyInterest({
      ftpPenaltyCurve: curve,
      calculationThroughDate: d("2022-08-01"),
    });
    expect("omitted" in outcome.result).toBe(true);
  });
});
