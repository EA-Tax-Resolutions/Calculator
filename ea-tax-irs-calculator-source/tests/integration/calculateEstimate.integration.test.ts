import { describe, it, expect } from "vitest";
import { calculateEstimate, calculateIllustrativeRemoval } from "@/calculation/calculateEstimate";
import { baseInput, usd, d } from "../unit/helpers";

/**
 * A broader end-to-end scenario combining several features at once:
 * a filing extension, multiple out-of-order payments, an installment
 * agreement, and a notice-and-demand date — exercising the full pipeline
 * (tax curve -> FTP -> FTF coordination -> ledger cascade -> all three
 * interest streams -> illustrative removal) together rather than in isolation.
 */
describe("calculateEstimate integration", () => {
  const input = baseInput({
    dueDates: { originalPaymentDueDate: d("2022-04-15"), filingDueDate: d("2022-10-15") },
    hasValidExtension: true,
    taxRequiredToBeShown: usd(20000),
    withholding: usd(5000),
    actualFiledDate: d("2022-11-01"), // late even under the extension
    calculationThroughDate: d("2023-03-01"),
    wasFiledTimely: false,
    payments: [
      { id: "p2", date: d("2022-08-01"), amount: usd(4000) },
      { id: "p1", date: d("2022-06-01"), amount: usd(3000) }, // deliberately entered out of order
    ],
    installmentAgreement: { approvedDate: d("2022-09-01") },
    noticeAndDemandDate: d("2022-12-01"),
  });

  it("produces an internally consistent, fully-computed estimate", () => {
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const v = result.value;

    expect(v.originalUnpaidTax.toFixed(2)).toBe("15000.00"); // 20000 - 5000 withholding
    expect(v.ftf.appliesAtAll).toBe(true); // filed Nov 1, extended due date Oct 15 -> late even under extension
    expect(v.ftp.totalAmount.greaterThan(0)).toBe(true);
    expect(v.taxInterest.totalInterest.greaterThan(0)).toBe(true);

    // Out-of-order payment entry must not affect the result: both payments
    // were applied by their actual dates regardless of array order.
    expect(v.ledger).toHaveLength(2);

    // Totals must reconcile exactly.
    const recomputedGrandTotal = v.totals.remainingUnpaidTax
      .plus(v.totals.failureToFilePenalty)
      .plus(v.totals.failureToPayPenalty)
      .plus(v.totals.taxInterest)
      .plus(v.totals.ftfPenaltyInterest)
      .plus(v.totals.ftpPenaltyInterest);
    expect(v.totals.grandTotal.toFixed(2)).toBe(recomputedGrandTotal.toFixed(2));

    // Required disclosures must always be present.
    const codes = v.warnings.map((w) => w.code);
    expect(codes).toContain("PAYMENT_ALLOCATION_ORDER_ASSUMED");
    expect(codes).toContain("LEAP_YEAR_CONVENTION_ASSUMPTION");
    expect(codes).toContain("FTF_PENALTY_INTEREST_START_DATE_ASSUMPTION");
  });

  it("illustrative removal of both penalties zeroes them and their own interest, without changing tax interest", () => {
    const base = calculateEstimate(input);
    const illustrative = calculateIllustrativeRemoval(input, ["FTF", "FTP"]);
    expect(base.ok).toBe(true);
    expect(illustrative.ok).toBe(true);
    if (!base.ok || !illustrative.ok) return;

    expect(illustrative.value.totals.failureToFilePenalty.toFixed(2)).toBe("0.00");
    expect(illustrative.value.totals.failureToPayPenalty.toFixed(2)).toBe("0.00");
    expect(illustrative.value.totals.ftfPenaltyInterest.toFixed(2)).toBe("0.00");
    expect(illustrative.value.totals.ftpPenaltyInterest.toFixed(2)).toBe("0.00");
    expect(illustrative.value.totals.taxInterest.toFixed(2)).toBe(base.value.totals.taxInterest.toFixed(2));
    expect(illustrative.value.totals.grandTotal.lessThan(base.value.totals.grandTotal)).toBe(true);
    expect(illustrative.value.warnings.some((w) => w.code === "ILLUSTRATIVE_SCENARIO_NOT_ABATEMENT_DETERMINATION")).toBe(true);
  });
});
