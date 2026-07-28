import { isBefore } from "./dates";
import { add, isZeroOrNegative, roundToCents, subtractFloorZero, ZERO, type Money } from "./money";
import { buildTaxPrincipalCurve, runPrincipalCascade, allocateExcessToInterest } from "./paymentLedger";
import { calculateFailureToPayPenalty } from "./failureToPay";
import { calculateFailureToFilePenalty } from "./failureToFile";
import { computeTaxInterest, computeFtfPenaltyInterest, computeFtpPenaltyInterest } from "./interest";
import { makeWarning } from "./warnings";
import { QUARTERLY_INTEREST_RATES } from "@/data/quarterlyInterestRates";
import type {
  EstimateInput,
  EstimateResult,
  EstimateTotals,
  OmittedInterestResult,
  Result,
  ValidationError,
  Warning,
} from "./types";

const RATE_TABLE_VERSION = `IRS quarterly interest rates verified through ${QUARTERLY_INTEREST_RATES[QUARTERLY_INTEREST_RATES.length - 1]?.quarterEnd ?? "unknown"}`;

function validate(input: EstimateInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isBefore(input.calculationThroughDate, input.dueDates.originalPaymentDueDate)) {
    errors.push({
      field: "calculationThroughDate",
      message: "The calculation-through date cannot be before the original payment due date.",
    });
  }
  if (input.hasValidExtension && isBefore(input.dueDates.filingDueDate, input.dueDates.originalPaymentDueDate)) {
    errors.push({
      field: "filingDueDate",
      message: "The extended filing due date cannot be before the original payment due date.",
    });
  }
  if (input.returnFiled && input.actualFiledDate === null) {
    errors.push({ field: "actualFiledDate", message: "An actual filed date is required when the return has been filed." });
  }
  if (input.taxRequiredToBeShown.isNegative()) {
    errors.push({ field: "taxRequiredToBeShown", message: "Tax required to be shown cannot be negative." });
  }
  for (const p of input.payments) {
    if (p.amount.isNegative()) {
      errors.push({ field: `payments.${p.id}`, message: "Payment amounts cannot be negative." });
    }
  }

  return errors;
}

export function calculateEstimate(input: EstimateInput): Result<EstimateResult, ValidationError[]> {
  const errors = validate(input);
  if (errors.length > 0) {
    return { ok: false, error: errors };
  }

  const warnings: Warning[] = [];

  const timelyPreDueDatePayments = add(
    input.withholding,
    input.timelyEstimatedPayments,
    input.refundableCredits,
    input.otherTimelyPayments,
  );
  const originalUnpaidTax = subtractFloorZero(input.taxRequiredToBeShown, timelyPreDueDatePayments);

  if (isZeroOrNegative(originalUnpaidTax)) {
    warnings.push(makeWarning("ZERO_OR_NEGATIVE_TAX_DUE", "info"));
  }

  // Pass A: tax-principal curve, needed before FTF/FTP amounts can be computed.
  const { curve: taxCurveA, hadDuplicateDates } = buildTaxPrincipalCurve(originalUnpaidTax, input.payments);
  if (hadDuplicateDates) {
    warnings.push(makeWarning("DUPLICATE_PAYMENT_DATE_MERGED", "info"));
  }

  const ftp = calculateFailureToPayPenalty({
    originalPaymentDueDate: input.dueDates.originalPaymentDueDate,
    calculationThroughDate: input.calculationThroughDate,
    capBase: originalUnpaidTax,
    taxCurve: taxCurveA,
    installmentAgreement: input.installmentAgreement,
    wasFiledTimely: input.wasFiledTimely,
    levyNoticeDate: input.levyNoticeDate,
  });
  if (ftp.anyIaAndLevyAmbiguity) {
    warnings.push(makeWarning("IA_AND_LEVY_BOTH_ACTIVE_SAME_MONTH", "review"));
  }

  const ftf = calculateFailureToFilePenalty({
    filingDueDate: input.dueDates.filingDueDate,
    originalDueDateForMinimumTable: input.dueDates.originalPaymentDueDate,
    returnFiled: input.returnFiled,
    actualFiledDate: input.actualFiledDate,
    taxRequiredToBeShown: input.taxRequiredToBeShown,
    timelyPreDueDatePayments,
    ftpMonthlyBreakdown: ftp.monthlyBreakdown,
  });
  if (ftf.minimumPenaltyApplied) {
    warnings.push(makeWarning("MINIMUM_PENALTY_APPLIED", "info"));
  }
  if (!datesShareDayOfMonth(input.dueDates.originalPaymentDueDate, input.dueDates.filingDueDate) && ftf.appliesAtAll) {
    warnings.push(makeWarning("FTF_FTP_MONTH_MISALIGNMENT", "review"));
  }

  // Pass B: full cascade now that FTF/FTP totals are known.
  const cascade = runPrincipalCascade({
    capBase: originalUnpaidTax,
    ftfTotal: ftf.finalAmount,
    ftpTotal: ftp.totalAmount,
    payments: input.payments,
  });

  const taxInterest = computeTaxInterest({
    originalPaymentDueDate: input.dueDates.originalPaymentDueDate,
    taxCurve: cascade.taxCurve,
    calculationThroughDate: input.calculationThroughDate,
    manualInterestRateOverride: input.manualInterestRateOverride,
  });

  const ftfPenaltyInterest = computeFtfPenaltyInterest({
    filingDueDate: input.dueDates.filingDueDate,
    ftfPenaltyCurve: cascade.ftfPenaltyCurve,
    calculationThroughDate: input.calculationThroughDate,
    manualInterestRateOverride: input.manualInterestRateOverride,
  });
  if (ftf.appliesAtAll) {
    warnings.push(makeWarning("FTF_PENALTY_INTEREST_START_DATE_ASSUMPTION", "review"));
  }

  const ftpPenaltyOutcome = computeFtpPenaltyInterest({
    noticeAndDemandDate: input.noticeAndDemandDate,
    noticeAndDemandAmount: input.noticeAndDemandAmount,
    ftpPenaltyCurve: cascade.ftpPenaltyCurve,
    calculationThroughDate: input.calculationThroughDate,
    manualInterestRateOverride: input.manualInterestRateOverride,
  });
  if (ftpPenaltyOutcome.gracePeriodMet) {
    warnings.push(makeWarning("FTP_PENALTY_INTEREST_GRACE_PERIOD_MET", "info"));
  } else if ("omitted" in ftpPenaltyOutcome.result) {
    warnings.push(makeWarning("FTP_PENALTY_INTEREST_OMITTED_NO_NOTICE_DATE", "info"));
  }

  const anyRateTableExceeded =
    taxInterest.rateTableExceeded ||
    ftfPenaltyInterest.rateTableExceeded ||
    ("rateTableExceeded" in ftpPenaltyOutcome.result && ftpPenaltyOutcome.result.rateTableExceeded);
  if (anyRateTableExceeded) {
    warnings.push(makeWarning("RATE_TABLE_EXCEEDED", "review"));
    if (input.manualInterestRateOverride !== undefined) {
      warnings.push(makeWarning("MANUAL_INTEREST_RATE_OVERRIDE_USED", "caution"));
    }
  }

  warnings.push(makeWarning("LEAP_YEAR_CONVENTION_ASSUMPTION", "review"));
  warnings.push(makeWarning("PAYMENT_ALLOCATION_ORDER_ASSUMED", "info"));

  const ftpPenaltyInterestTotal: Money = "omitted" in ftpPenaltyOutcome.result ? ZERO : ftpPenaltyOutcome.result.totalInterest;

  const ledger = allocateExcessToInterest(cascade.perPayment, {
    taxInterest: taxInterest.totalInterest,
    ftfPenaltyInterest: ftfPenaltyInterest.totalInterest,
    ftpPenaltyInterest: ftpPenaltyInterestTotal,
  });
  // Restore original payment ids/notes for display (allocateExcessToInterest works off merged payments).
  const idByDate = new Map(input.payments.map((p) => [p.date.toString(), p]));
  for (const entry of ledger) {
    const original = idByDate.get(entry.payment.date.toString());
    if (original) entry.payment = original;
  }

  const excessAppliedToTaxInterest = sumField(ledger, "toTaxInterest");
  const excessAppliedToFtfPenaltyInterest = sumField(ledger, "toFtfPenaltyInterest");
  const excessAppliedToFtpPenaltyInterest = sumField(ledger, "toFtpPenaltyInterest");

  // Every field on `totals` is rounded to the cent HERE, at construction,
  // and every aggregate (totalPenalties, totalInterest, grandTotal) is then
  // summed from those already-rounded values rather than from full-precision
  // figures rounded independently afterward. This is a deliberate choice:
  // summing full-precision components and rounding once is marginally more
  // "mathematically pure," but it can make a displayed total differ by a
  // cent from the sum of the displayed line items above it — exactly the
  // kind of penny mismatch a client or reviewing CPA would (reasonably)
  // read as a bug. All intermediate calculation math elsewhere in this
  // engine remains full-precision; only this final display-facing object rounds early.
  const remainingUnpaidTax = roundToCents(cascade.taxCurve.balanceAsOf(input.calculationThroughDate));
  const remainingFtfPenalty = roundToCents(cascade.ftfPenaltyCurve.balanceAsOf(input.calculationThroughDate));
  const remainingFtpPenalty = roundToCents(cascade.ftpPenaltyCurve.balanceAsOf(input.calculationThroughDate));
  const remainingTaxInterest = roundToCents(subtractFloorZero(taxInterest.totalInterest, excessAppliedToTaxInterest));
  const remainingFtfPenaltyInterest = roundToCents(
    subtractFloorZero(ftfPenaltyInterest.totalInterest, excessAppliedToFtfPenaltyInterest),
  );
  const remainingFtpPenaltyInterest = roundToCents(
    subtractFloorZero(ftpPenaltyInterestTotal, excessAppliedToFtpPenaltyInterest),
  );

  const totalPenalties = add(remainingFtfPenalty, remainingFtpPenalty);
  const totalInterest = add(remainingTaxInterest, remainingFtfPenaltyInterest, remainingFtpPenaltyInterest);
  const grandTotal = add(remainingUnpaidTax, totalPenalties, totalInterest);

  const totals: EstimateTotals = {
    originalUnpaidTax: roundToCents(originalUnpaidTax),
    remainingUnpaidTax,
    failureToFilePenalty: remainingFtfPenalty,
    failureToPayPenalty: remainingFtpPenalty,
    taxInterest: remainingTaxInterest,
    ftfPenaltyInterest: remainingFtfPenaltyInterest,
    ftpPenaltyInterest: remainingFtpPenaltyInterest,
    totalPenalties,
    totalInterest,
    grandTotal,
  };

  const result: EstimateResult = {
    input,
    originalUnpaidTax,
    ftf,
    ftp,
    taxInterest,
    ftfPenaltyInterest,
    ftpPenaltyInterest: ftpPenaltyOutcome.result,
    ledger,
    totals,
    warnings,
    rateTableVersion: RATE_TABLE_VERSION,
  };

  return { ok: true, value: result };
}

/**
 * Illustrative "what if selected penalties were removed" scenario. This is
 * a post-hoc netting against the already-computed real estimate — it
 * zeroes the selected penalty's remaining balance and its own penalty
 * interest in a copy of the totals, rather than re-deriving a hypothetical
 * world where that penalty never existed. In particular, if FTP is
 * selected for removal, failure-to-file's coordination reduction is left
 * exactly as computed (it nets against the FTP amount actually imposed by
 * the statute; an illustrative "remove FTP" scenario doesn't rewrite that
 * history). This is explicitly NOT a penalty-relief eligibility
 * determination — see the required disclosure warning below.
 */
export function calculateIllustrativeRemoval(
  input: EstimateInput,
  remove: Array<"FTF" | "FTP">,
): Result<EstimateResult, ValidationError[]> {
  const base = calculateEstimate(input);
  if (!base.ok) return base;
  if (remove.length === 0) return base;

  const value = base.value;
  const removeFtf = remove.includes("FTF");
  const removeFtp = remove.includes("FTP");

  const totals: EstimateTotals = {
    ...value.totals,
    failureToFilePenalty: removeFtf ? ZERO : value.totals.failureToFilePenalty,
    ftfPenaltyInterest: removeFtf ? ZERO : value.totals.ftfPenaltyInterest,
    failureToPayPenalty: removeFtp ? ZERO : value.totals.failureToPayPenalty,
    ftpPenaltyInterest: removeFtp ? ZERO : value.totals.ftpPenaltyInterest,
  };
  totals.totalPenalties = add(totals.failureToFilePenalty, totals.failureToPayPenalty);
  totals.totalInterest = add(totals.taxInterest, totals.ftfPenaltyInterest, totals.ftpPenaltyInterest);
  totals.grandTotal = add(totals.remainingUnpaidTax, totals.totalPenalties, totals.totalInterest);

  const warnings = [...value.warnings, makeWarning("ILLUSTRATIVE_SCENARIO_NOT_ABATEMENT_DETERMINATION", "review")];

  return { ok: true, value: { ...value, totals, warnings } };
}

function sumField(
  ledger: EstimateResult["ledger"],
  field: "toTaxInterest" | "toFtfPenaltyInterest" | "toFtpPenaltyInterest",
): Money {
  return ledger.reduce((sum, entry) => add(sum, entry.allocation[field]), ZERO);
}

function datesShareDayOfMonth(a: { day: number }, b: { day: number }): boolean {
  return a.day === b.day;
}
