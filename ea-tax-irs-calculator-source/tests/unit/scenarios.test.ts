import { describe, it, expect } from "vitest";
import { calculateEstimate } from "@/calculation/calculateEstimate";
import { calculateFailureToPayPenalty } from "@/calculation/failureToPay";
import { buildTaxPrincipalCurve } from "@/calculation/paymentLedger";
import { baseInput, usd, d } from "./helpers";

describe("Remaining required scenarios (spec section 21)", () => {
  it("1. one-day-late filing creates exactly one FTF penalty month", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      actualFiledDate: d("2022-04-16"),
      calculationThroughDate: d("2022-04-16"),
      wasFiledTimely: false,
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ftf.monthsLate).toBe(1);
  });

  it("2. one-day-late payment charges a full month's FTP penalty", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, [{ id: "p1", date: d("2022-04-16"), amount: usd(1000) }]);
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-04-16"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
    });
    expect(result.monthlyBreakdown).toHaveLength(1);
    expect(result.monthlyBreakdown[0]?.amount.toFixed(2)).toBe("5.00"); // 0.5% of 1000, full month even though paid the next day
  });

  it("3. valid filing extension still leaves the payment late (extension does not extend time to pay)", () => {
    const input = baseInput({
      dueDates: { originalPaymentDueDate: d("2022-04-15"), filingDueDate: d("2022-10-15") },
      hasValidExtension: true,
      taxRequiredToBeShown: usd(1000),
      actualFiledDate: d("2022-10-10"), // filed timely under the extension
      calculationThroughDate: d("2022-10-10"),
      wasFiledTimely: true,
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ftf.appliesAtAll).toBe(false); // filed timely under the extension -> no FTF
    expect(result.value.ftp.totalAmount.greaterThan(0)).toBe(true); // but FTP still runs from the original payment due date
  });

  it("4. a partial payment during a penalty month does not reduce that month's own charge", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, [{ id: "p1", date: d("2022-05-01"), amount: usd(400) }]);
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-06-01"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
    });
    // Month 1 (Apr16-May15) balance at start is still the full $1,000 even
    // though the $400 payment lands inside that same month (May 1).
    expect(result.monthlyBreakdown[0]?.balanceAtStart.toFixed(2)).toBe("1000.00");
    expect(result.monthlyBreakdown[1]?.balanceAtStart.toFixed(2)).toBe("600.00");
  });

  it("5. multiple payments on the same date are summed, not dropped", () => {
    const { curve } = buildTaxPrincipalCurve(usd(1000), [
      { id: "p1", date: d("2022-05-01"), amount: usd(300) },
      { id: "p2", date: d("2022-05-01"), amount: usd(200) },
    ]);
    expect(curve.balanceAsOf(d("2022-05-01")).toFixed(2)).toBe("500.00");
  });

  it("6. payments entered out of chronological order are sorted before calculation", () => {
    const { curve: curveOutOfOrder } = buildTaxPrincipalCurve(usd(1000), [
      { id: "p2", date: d("2022-06-01"), amount: usd(300) },
      { id: "p1", date: d("2022-05-01"), amount: usd(200) },
    ]);
    const { curve: curveInOrder } = buildTaxPrincipalCurve(usd(1000), [
      { id: "p1", date: d("2022-05-01"), amount: usd(200) },
      { id: "p2", date: d("2022-06-01"), amount: usd(300) },
    ]);
    expect(curveOutOfOrder.balanceAsOf(d("2022-05-01")).toFixed(2)).toBe(curveInOrder.balanceAsOf(d("2022-05-01")).toFixed(2));
    expect(curveOutOfOrder.balanceAsOf(d("2022-06-01")).toFixed(2)).toBe(curveInOrder.balanceAsOf(d("2022-06-01")).toFixed(2));
  });

  it("9. a timely-filed return with an approved installment agreement gets the 0.25% rate", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, []);
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-05-20"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
      installmentAgreement: { approvedDate: d("2022-04-16") },
    });
    expect(result.monthlyBreakdown[0]?.rateReason).toBe("installment_agreement");
    expect(result.monthlyBreakdown[0]?.rate.toFixed(4)).toBe("0.0025");
  });

  it("10. an installment agreement date alone does NOT give the 0.25% rate if the return was filed late", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, []);
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-05-20"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: false, // filed late -> IA rate does not apply regardless of the IA field
      installmentAgreement: { approvedDate: d("2022-04-16") },
    });
    expect(result.monthlyBreakdown[0]?.rateReason).toBe("standard");
    expect(result.monthlyBreakdown[0]?.rate.toFixed(4)).toBe("0.0050");
  });

  it("12. failure-to-pay penalty stops at exactly 25% of the cap base", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, []); // never paid
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2027-04-15"), // far beyond 50 months (25% / 0.5%)
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
    });
    expect(result.cappedAt25Percent).toBe(true);
    expect(result.totalAmount.toFixed(2)).toBe("250.00"); // 25% of $1,000
  });

  it("13. failure-to-file penalty is capped at 5 months even if filed much later", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      actualFiledDate: d("2023-06-01"), // more than 5 months after Apr 15 2022
      calculationThroughDate: d("2023-06-01"),
      wasFiledTimely: false,
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ftf.monthsLate).toBe(5);
  });

  it("16. full payment made exactly on the original due date incurs no penalty or interest", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      calculationThroughDate: d("2022-04-15"),
      payments: [{ id: "p1", date: d("2022-04-15"), amount: usd(1000) }],
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ftp.totalAmount.toFixed(2)).toBe("0.00");
    expect(result.value.taxInterest.totalInterest.toFixed(2)).toBe("0.00");
  });

  it("17. a payment made one day after the due date still leaves one FTP month chargeable on the pre-payment balance", () => {
    const capBase = usd(1000);
    const { curve } = buildTaxPrincipalCurve(capBase, [{ id: "p1", date: d("2022-04-16"), amount: usd(1000) }]);
    const result = calculateFailureToPayPenalty({
      originalPaymentDueDate: d("2022-04-15"),
      calculationThroughDate: d("2022-04-16"),
      capBase,
      taxCurve: curve,
      wasFiledTimely: true,
    });
    expect(result.totalAmount.toFixed(2)).toBe("5.00");
  });

  it("20. FTF/FTP coordination nets the actual dollar amount even when FTP runs at a non-standard (levy) rate", () => {
    // A levy notice pushes FTP to 1% starting month 2, while FTF is still
    // running concurrently (late-filed). The coordination reduction for
    // those later months must net against the ACTUAL 1%-based FTP dollars
    // ($10/month), not a hardcoded 4.5%-style assumption ($45/month net).
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      actualFiledDate: d("2022-09-01"),
      calculationThroughDate: d("2022-09-01"),
      wasFiledTimely: false,
      levyNoticeDate: d("2022-04-20"), // threshold Apr 30 -> 1% from month 2 (May 16) onward
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.ftp.monthlyBreakdown[0]?.rateReason).toBe("standard");
    expect(result.value.ftp.monthlyBreakdown[1]?.rateReason).toBe("levy_notice");
    expect(result.value.ftp.monthlyBreakdown[1]?.rate.toFixed(4)).toBe("0.0100");

    // Month 1 (standard 0.5%): gross 50, overlap 5, net 45.
    expect(result.value.ftf.monthlyBreakdown[0]?.ftpOverlapReduction.toFixed(2)).toBe("5.00");
    expect(result.value.ftf.monthlyBreakdown[0]?.netAmount.toFixed(2)).toBe("45.00");
    // Month 2 onward (levy 1%): gross 50, overlap 10, net 40 - not the
    // standard-rate 45 a hardcoded coordination percentage would have produced.
    expect(result.value.ftf.monthlyBreakdown[1]?.ftpOverlapReduction.toFixed(2)).toBe("10.00");
    expect(result.value.ftf.monthlyBreakdown[1]?.netAmount.toFixed(2)).toBe("40.00");
    expect(result.value.ftf.netTotal.toFixed(2)).toBe("205.00"); // 45 + 40*4
  });

  it("21. zero unpaid tax produces a zero estimate with no penalties or interest", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      withholding: usd(1000),
      calculationThroughDate: d("2022-12-31"),
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.originalUnpaidTax.toFixed(2)).toBe("0.00");
    expect(result.value.totals.grandTotal.toFixed(2)).toBe("0.00");
    expect(result.value.warnings.some((w) => w.code === "ZERO_OR_NEGATIVE_TAX_DUE")).toBe(true);
  });

  it("22. a refund situation (payments exceed tax shown) is floored at zero unpaid tax, never negative", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      withholding: usd(1500),
      calculationThroughDate: d("2022-12-31"),
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.originalUnpaidTax.toFixed(2)).toBe("0.00");
    expect(result.value.originalUnpaidTax.isNegative()).toBe(false);
  });

  it("23. an invalid date order (extended filing date before the original due date) is rejected", () => {
    const input = baseInput({
      dueDates: { originalPaymentDueDate: d("2022-04-15"), filingDueDate: d("2022-03-01") },
      hasValidExtension: true,
      taxRequiredToBeShown: usd(1000),
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(false);
  });

  it("24. a calculation-through date before the original due date is rejected", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(1000),
      calculationThroughDate: d("2022-01-01"),
    });
    const result = calculateEstimate(input);
    expect(result.ok).toBe(false);
  });
});
