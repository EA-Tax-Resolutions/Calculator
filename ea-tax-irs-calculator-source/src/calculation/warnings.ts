import type { Warning, WarningCode, WarningSeverity } from "./types";

const MESSAGES: Record<WarningCode, string> = {
  RATE_TABLE_EXCEEDED:
    "The calculation-through date extends beyond the last verified IRS quarterly interest rate. Interest stops accruing at the last verified quarter unless a manual override rate is supplied.",
  MANUAL_INTEREST_RATE_OVERRIDE_USED:
    "A manually entered interest rate was used for one or more periods beyond the last verified IRS quarterly rate. This is a user-supplied estimate, not a published IRS rate.",
  FTF_PENALTY_INTEREST_START_DATE_ASSUMPTION:
    "Interest on the failure-to-file penalty is calculated from the applicable filing due date (including a valid extension), based on this application's reading of IRC Section 6601(e)(2)(B). Confirm this interpretation against current IRS guidance before relying on the result.",
  LEAP_YEAR_CONVENTION_ASSUMPTION:
    "Daily interest is computed using an actual/actual convention (annual rate divided by 365, or 366 in a leap year). Confirm this convention against 26 CFR 301.6622-1 and IRM 20.2.5 before relying on the result.",
  PAYMENT_ALLOCATION_ORDER_ASSUMED:
    "Payments are applied in this order for estimation purposes: unpaid tax, then the failure-to-file penalty, then the failure-to-pay penalty, then accrued interest on each in the same order. The IRS may apply payments differently based on transcript transactions, designated payments, assessments, credits, and account history.",
  IA_AND_LEVY_BOTH_ACTIVE_SAME_MONTH:
    "Both an active installment agreement and a levy-notice rate condition were indicated for the same penalty month. The 1% levy-notice rate was used for that month. Please verify this combination against the account history, as an active installment agreement ordinarily precludes a levy notice.",
  FTF_FTP_MONTH_MISALIGNMENT:
    "The failure-to-file and failure-to-pay penalty months are not calendar-aligned (this can occur with a nonstandard extension date). The overlap reduction was apportioned by day count. Verify this result carefully.",
  FTP_PENALTY_INTEREST_GRACE_PERIOD_MET:
    "The failure-to-pay penalty was paid in full within the applicable 21-day (or 10-business-day) period following the notice and demand date, so no interest was calculated on that penalty, per IRC Section 6601(e).",
  FTP_PENALTY_INTEREST_OMITTED_NO_NOTICE_DATE:
    "Interest on the failure-to-pay penalty is not included because an applicable IRS notice-and-demand date was not entered.",
  DUPLICATE_PAYMENT_DATE_MERGED:
    "Multiple payments entered on the same date were combined for calculation purposes.",
  ZERO_OR_NEGATIVE_TAX_DUE:
    "Based on the amounts entered, there is no unpaid tax. No penalties or interest were calculated.",
  MINIMUM_PENALTY_APPLIED:
    "The return was filed more than 60 days after the applicable filing due date, so the failure-to-file penalty was set to the lesser of the applicable statutory minimum or 100% of the unpaid tax.",
  ILLUSTRATIVE_SCENARIO_NOT_ABATEMENT_DETERMINATION:
    "This scenario does not determine whether you qualify for penalty relief. Eligibility depends on the account history, penalty type, facts, and supporting information. The IRS makes the final decision.",
};

export function makeWarning(
  code: WarningCode,
  severity: WarningSeverity,
  context?: Record<string, unknown>,
): Warning {
  return {
    code,
    severity,
    message: MESSAGES[code],
    context,
  };
}
