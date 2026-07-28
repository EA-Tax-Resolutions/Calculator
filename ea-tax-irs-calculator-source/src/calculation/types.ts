import type { Money, Rate } from "./money";
import type { PlainDate, DateRange } from "./dates";

export type { Money, Rate };

/**
 * The two due dates are intentionally separate fields everywhere in this
 * codebase and must never be conflated:
 *  - originalPaymentDueDate: never moves. Anchors failure-to-pay, interest
 *    on unpaid tax, and the "timely payment" cutoff used by both penalty
 *    bases and the minimum-penalty dollar-table lookup.
 *  - filingDueDate: the original filing due date, or the extended date if
 *    the taxpayer had a valid filing extension. Anchors failure-to-file's
 *    own month count, the 60-days-late test, and (per IRC 6601(e)(2)(B))
 *    the start date for interest on the failure-to-file penalty.
 * A filing extension never moves originalPaymentDueDate.
 */
export interface DueDates {
  originalPaymentDueDate: PlainDate;
  filingDueDate: PlainDate;
}

export interface PaymentInput {
  id: string;
  date: PlainDate;
  amount: Money;
  note?: string;
}

export type RateReason = "standard" | "installment_agreement" | "levy_notice";

export interface PenaltyMonth extends DateRange {
  index: number;
  balanceAtStart: Money;
  rate: Rate;
  rateReason: RateReason;
  amount: Money;
  cumulativeAfter: Money;
}

export interface FailureToFileMonthDetail extends DateRange {
  index: number;
  grossAmount: Money;
  ftpOverlapReduction: Money;
  netAmount: Money;
}

export interface FailureToFileResult {
  appliesAtAll: boolean;
  monthsLate: number;
  grossTotal: Money;
  coordinationReduction: Money;
  netTotal: Money;
  minimumPenaltyApplied: boolean;
  minimumPenaltyAmount: Money | null;
  finalAmount: Money;
  monthlyBreakdown: FailureToFileMonthDetail[];
}

export interface FailureToPayResult {
  monthlyBreakdown: PenaltyMonth[];
  totalAmount: Money;
  cappedAt25Percent: boolean;
  capBase: Money;
}

export interface InterestSegment extends DateRange {
  days: number;
  annualRate: Rate;
  dailyRate: Rate;
  principalAtStart: Money;
  interestForSegment: Money;
  quarterLabel: string;
  verified: boolean;
}

export interface InterestResult {
  segments: InterestSegment[];
  totalInterest: Money;
  rateTableExceeded: boolean;
  exceededAtDate: PlainDate | null;
  manualOverrideRate: Rate | null;
}

export type OmittedInterestResult = { omitted: true; reason: string };

export interface LedgerStep {
  date: PlainDate;
  remainingAfter: Money;
}

/** A step function of a bucket's remaining balance over time, for interest compounding. */
export interface BalanceCurve {
  initial: Money;
  steps: LedgerStep[];
  balanceAsOf(date: PlainDate): Money;
}

export interface PaymentCascadeEntry {
  toTaxPrincipal: Money;
  toFtfPenalty: Money;
  toFtpPenalty: Money;
  toTaxInterest: Money;
  toFtfPenaltyInterest: Money;
  toFtpPenaltyInterest: Money;
  unapplied: Money;
}

export interface PaymentAllocation {
  payment: PaymentInput;
  allocation: PaymentCascadeEntry;
}

export type WarningSeverity = "info" | "caution" | "review";

export type WarningCode =
  | "RATE_TABLE_EXCEEDED"
  | "MANUAL_INTEREST_RATE_OVERRIDE_USED"
  | "FTF_PENALTY_INTEREST_START_DATE_ASSUMPTION"
  | "LEAP_YEAR_CONVENTION_ASSUMPTION"
  | "PAYMENT_ALLOCATION_ORDER_ASSUMED"
  | "IA_AND_LEVY_BOTH_ACTIVE_SAME_MONTH"
  | "FTF_FTP_MONTH_MISALIGNMENT"
  | "FTP_PENALTY_INTEREST_GRACE_PERIOD_MET"
  | "FTP_PENALTY_INTEREST_OMITTED_NO_NOTICE_DATE"
  | "DUPLICATE_PAYMENT_DATE_MERGED"
  | "ZERO_OR_NEGATIVE_TAX_DUE"
  | "MINIMUM_PENALTY_APPLIED"
  | "ILLUSTRATIVE_SCENARIO_NOT_ABATEMENT_DETERMINATION";

export interface Warning {
  code: WarningCode;
  severity: WarningSeverity;
  message: string;
  context?: Record<string, unknown>;
}

export interface InstallmentAgreementInput {
  approvedDate: PlainDate;
  endDate?: PlainDate;
}

export interface EstimateInput {
  dueDates: DueDates;
  hasValidExtension: boolean;
  taxRequiredToBeShown: Money;
  withholding: Money;
  timelyEstimatedPayments: Money;
  refundableCredits: Money;
  otherTimelyPayments: Money;
  returnFiled: boolean;
  actualFiledDate: PlainDate | null;
  calculationThroughDate: PlainDate;
  payments: PaymentInput[];
  installmentAgreement?: InstallmentAgreementInput;
  wasFiledTimely: boolean;
  levyNoticeDate?: PlainDate;
  noticeAndDemandDate?: PlainDate;
  noticeAndDemandAmount?: Money;
  manualInterestRateOverride?: Rate;
}

export interface EstimateTotals {
  originalUnpaidTax: Money;
  remainingUnpaidTax: Money;
  failureToFilePenalty: Money;
  failureToPayPenalty: Money;
  taxInterest: Money;
  ftfPenaltyInterest: Money;
  ftpPenaltyInterest: Money;
  totalPenalties: Money;
  totalInterest: Money;
  grandTotal: Money;
}

export interface EstimateResult {
  input: EstimateInput;
  originalUnpaidTax: Money;
  ftf: FailureToFileResult;
  ftp: FailureToPayResult;
  taxInterest: InterestResult;
  ftfPenaltyInterest: InterestResult;
  ftpPenaltyInterest: InterestResult | OmittedInterestResult;
  ledger: PaymentAllocation[];
  totals: EstimateTotals;
  warnings: Warning[];
  rateTableVersion: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
