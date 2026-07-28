import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { runPrincipalCascade } from "@/calculation/paymentLedger";
import { computeFtfPenaltyInterest } from "@/calculation/interest";
import { usd, d } from "./helpers";

/**
 * Required regression test: a payment that exactly satisfies all remaining
 * tax principal and then partially pays down the FTF penalty. Interest on
 * the PAID portion of the FTF penalty must stop accruing on the payment
 * date, while interest on the REMAINING unpaid portion continues.
 *
 * Setup: tax principal $1,000, FTF penalty $45 (assessed as of the filing
 * due date 2023-04-15). A single payment of $1,020 on 2023-05-01 exactly
 * covers the $1,000 tax principal, then applies its $20 excess to the FTF
 * penalty, leaving $25 of FTF penalty still outstanding.
 */
describe("Gate 5: payment cascade reduces penalty-interest principal", () => {
  const capBase = usd(1000);
  const ftfTotal = usd(45);
  const ftpTotal = usd(0);
  const filingDueDate = d("2023-04-15");
  const calcThroughDate = d("2023-06-01");

  it("cascades a single payment: tax principal first, then FTF penalty principal", () => {
    const cascade = runPrincipalCascade({
      capBase,
      ftfTotal,
      ftpTotal,
      payments: [{ id: "p1", date: d("2023-05-01"), amount: usd(1020) }],
    });

    expect(cascade.taxCurve.balanceAsOf(d("2023-05-01")).toFixed(2)).toBe("0.00");
    expect(cascade.ftfPenaltyCurve.balanceAsOf(d("2023-05-01")).toFixed(2)).toBe("25.00");
    expect(cascade.perPayment[0]?.toTaxPrincipal.toFixed(2)).toBe("1000.00");
    expect(cascade.perPayment[0]?.toFtfPenalty.toFixed(2)).toBe("20.00");
    expect(cascade.perPayment[0]?.unappliedToPrincipal.toFixed(2)).toBe("0.00");
  });

  it("stops interest on the paid $20 portion at the payment date, while the unpaid $25 continues to accrue", () => {
    const cascade = runPrincipalCascade({
      capBase,
      ftfTotal,
      ftpTotal,
      payments: [{ id: "p1", date: d("2023-05-01"), amount: usd(1020) }],
    });

    const withPayment = computeFtfPenaltyInterest({
      filingDueDate,
      ftfPenaltyCurve: cascade.ftfPenaltyCurve,
      calculationThroughDate: calcThroughDate,
    });

    // Baseline A: the full $45 had never been paid down at all.
    const neverPaidCurve = { initial: usd(45), steps: [], balanceAsOf: () => usd(45) };
    const neverPaid = computeFtfPenaltyInterest({
      filingDueDate,
      ftfPenaltyCurve: neverPaidCurve,
      calculationThroughDate: calcThroughDate,
    });

    // Baseline B: only $25 had existed from day one (as if the paid $20 was never owed).
    const onlyRemainderCurve = { initial: usd(25), steps: [], balanceAsOf: () => usd(25) };
    const onlyRemainder = computeFtfPenaltyInterest({
      filingDueDate,
      ftfPenaltyCurve: onlyRemainderCurve,
      calculationThroughDate: calcThroughDate,
    });

    // The real result must fall strictly between the two baselines: less
    // than "never paid" (since $20 stopped compounding on 2023-05-01), but
    // more than "only $25 the whole time" (since the full $45 DID compound
    // for the 16 days before the payment).
    expect(withPayment.totalInterest.lessThan(neverPaid.totalInterest)).toBe(true);
    expect(withPayment.totalInterest.greaterThan(onlyRemainder.totalInterest)).toBe(true);
  });

  it("matches an exact hand-computed value for the with-payment scenario", () => {
    const cascade = runPrincipalCascade({
      capBase,
      ftfTotal,
      ftpTotal,
      payments: [{ id: "p1", date: d("2023-05-01"), amount: usd(1020) }],
    });

    const withPayment = computeFtfPenaltyInterest({
      filingDueDate,
      ftfPenaltyCurve: cascade.ftfPenaltyCurve,
      calculationThroughDate: calcThroughDate,
    });

    // 2023 Q2 (Apr-Jun) rate is 7%, actual/actual daily rate over 365 (2023 is not a leap year).
    const dailyRate = new Decimal("0.07").dividedBy(365);
    // Segment 1: 2023-04-15 through 2023-04-30 inclusive = 16 days, principal $45.
    const afterSeg1 = new Decimal(45).times(new Decimal(1).plus(dailyRate).pow(16));
    // Payment lands 2023-05-01: principal drops by the $20 actually applied to FTF penalty.
    const afterStepDown = afterSeg1.minus(20);
    // Segment 2: 2023-05-01 through 2023-06-01 inclusive = 32 days.
    const finalBalance = afterStepDown.times(new Decimal(1).plus(dailyRate).pow(32));
    // Total interest = final compounded balance minus the $25 of FTF-penalty
    // principal that remains unpaid (the $20 that WAS paid off is principal,
    // not interest, so it nets out of the interest figure entirely).
    const expectedInterest = finalBalance.minus(25);

    expect(withPayment.totalInterest.toFixed(2)).toBe(expectedInterest.toFixed(2));
  });
});
