import Decimal from "decimal.js";
import {
  addBusinessDays,
  addDays,
  dayAfter,
  daysBetween,
  daysInYear,
  isAfter,
  isSameOrBefore,
  startOfYear,
  type PlainDate,
} from "./dates";
import {
  add,
  gte,
  isPositive,
  isZero,
  isZeroOrNegative,
  money,
  rate,
  subtractFloorZero,
  ZERO,
  type Money,
  type Rate,
} from "./money";
import { getQuarterlyRate, getLastVerifiedQuarterEnd, QUARTERLY_INTEREST_RATES } from "@/data/quarterlyInterestRates";
import type { BalanceCurve, InterestResult, InterestSegment, OmittedInterestResult } from "./types";
import { parseISODate } from "./dates";

/**
 * Interest is computed as an EXACT closed form per atomic segment
 * (balance * (1+dailyRate)^days via Decimal.pow), not by looping one day
 * at a time in the production path — a day-by-day reference walk exists
 * only in the test suite, to cross-validate this formula. Interest
 * genuinely compounds daily (IRC 6622): a running balance (principal +
 * already-accrued-but-unpaid interest) is carried forward across segment
 * boundaries, so interest itself earns interest, exactly as the statute
 * requires — only a principal payment (from the ledger cascade) reduces
 * the running balance mid-stream; passing time and quarter-rate changes
 * alone never reset it.
 *
 * FLAGGED ASSUMPTION (LEAP_YEAR_CONVENTION_ASSUMPTION): the daily rate is
 * annualRate / daysInYear (365, or 366 in a leap year — actual/actual).
 * Confirm against 26 CFR 301.6622-1 / IRM 20.2.5 before relying on results.
 */
function buildBreakpoints(accrualStartDate: PlainDate, calcThroughDate: PlainDate, curve: BalanceCurve): PlainDate[] {
  const points = new Map<string, PlainDate>();
  points.set(accrualStartDate.toString(), accrualStartDate);

  for (const row of QUARTERLY_INTEREST_RATES) {
    const qStart = parseISODate(row.quarterStart);
    if (isAfter(qStart, accrualStartDate) && isSameOrBefore(qStart, calcThroughDate)) {
      points.set(qStart.toString(), qStart);
    }
  }

  for (const step of curve.steps) {
    if (isAfter(step.date, accrualStartDate) && isSameOrBefore(step.date, calcThroughDate)) {
      points.set(step.date.toString(), step.date);
    }
  }

  // Year boundaries too, so a manual-override tail (which has no quarter
  // breakpoints of its own) never spans a leap-year boundary within one segment.
  for (let year = accrualStartDate.year + 1; year <= calcThroughDate.year; year++) {
    const jan1 = startOfYear(year);
    if (isAfter(jan1, accrualStartDate) && isSameOrBefore(jan1, calcThroughDate)) {
      points.set(jan1.toString(), jan1);
    }
  }

  // The verified/unverified boundary itself must be a breakpoint even when
  // it doesn't line up with a table row (e.g. accrualStartDate already
  // falls mid-quarter inside the last verified quarter) — otherwise a
  // single segment could silently straddle verified and manual-override
  // territory instead of being split so each portion is flagged correctly.
  const firstUnverifiedDay = getLastVerifiedQuarterEnd().add({ days: 1 });
  if (isAfter(firstUnverifiedDay, accrualStartDate) && isSameOrBefore(firstUnverifiedDay, calcThroughDate)) {
    points.set(firstUnverifiedDay.toString(), firstUnverifiedDay);
  }

  const sorted = [...points.values()].sort((a, b) => (a.toString() < b.toString() ? -1 : a.toString() > b.toString() ? 1 : 0));
  sorted.push(addDays(calcThroughDate, 1)); // closing sentinel
  return sorted;
}

export function computeCompoundInterestOverSegments(params: {
  curve: BalanceCurve;
  accrualStartDate: PlainDate;
  calcThroughDate: PlainDate;
  manualOverrideRate?: Rate;
}): InterestResult {
  const { curve, accrualStartDate, calcThroughDate, manualOverrideRate } = params;

  if (isAfter(accrualStartDate, calcThroughDate) || isZero(curve.initial)) {
    return { segments: [], totalInterest: ZERO, rateTableExceeded: false, exceededAtDate: null, manualOverrideRate: manualOverrideRate ?? null };
  }

  const breakpoints = buildBreakpoints(accrualStartDate, calcThroughDate, curve);

  let runningBalance: Money = curve.balanceAsOf(accrualStartDate);
  let rateTableExceeded = false;
  let exceededAtDate: PlainDate | null = null;
  const segments: InterestSegment[] = [];
  let totalInterest = ZERO;

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const segStart = breakpoints[i]!;
    const segEnd = addDays(breakpoints[i + 1]!, -1);

    if (i > 0) {
      const dayBefore = addDays(segStart, -1);
      const stepDown = curve.balanceAsOf(dayBefore).minus(curve.balanceAsOf(segStart));
      if (stepDown.isPositive()) {
        runningBalance = subtractFloorZero(runningBalance, money(stepDown));
      }
    }

    if (isZeroOrNegative(runningBalance)) {
      continue; // fully paid; later segments (if any) would also be zero
    }

    const resolved = getQuarterlyRate(segStart);
    let annualRate: Rate;
    let verified: boolean;
    let quarterLabel: string;

    if (resolved) {
      annualRate = resolved.rate;
      verified = true;
      quarterLabel = resolved.quarterLabel;
    } else if (manualOverrideRate !== undefined) {
      annualRate = manualOverrideRate;
      verified = false;
      quarterLabel = "Manual override";
      if (!rateTableExceeded) {
        rateTableExceeded = true;
        exceededAtDate = getLastVerifiedQuarterEnd().add({ days: 1 });
      }
    } else {
      if (!rateTableExceeded) {
        rateTableExceeded = true;
        exceededAtDate = getLastVerifiedQuarterEnd().add({ days: 1 });
      }
      break; // hard stop — no silent carry-forward of the previous rate
    }

    const days = daysBetween(segStart, segEnd) + 1;
    const dailyRate = rate(annualRate.dividedBy(daysInYear(segStart.year)));
    const growthFactor = new Decimal(1).plus(dailyRate).pow(days);
    const interestForSegment = money(runningBalance.times(growthFactor.minus(1)));

    segments.push({
      start: segStart,
      end: segEnd,
      days,
      annualRate,
      dailyRate,
      principalAtStart: runningBalance,
      interestForSegment,
      quarterLabel,
      verified,
    });

    totalInterest = add(totalInterest, interestForSegment);
    runningBalance = money(runningBalance.times(growthFactor));
  }

  return { segments, totalInterest, rateTableExceeded, exceededAtDate, manualOverrideRate: manualOverrideRate ?? null };
}

/** Interest on unpaid tax begins the day after the original payment due date (a filing extension never extends this). */
export function computeTaxInterest(params: {
  originalPaymentDueDate: PlainDate;
  taxCurve: BalanceCurve;
  calculationThroughDate: PlainDate;
  manualInterestRateOverride?: Rate;
}): InterestResult {
  return computeCompoundInterestOverSegments({
    curve: params.taxCurve,
    accrualStartDate: dayAfter(params.originalPaymentDueDate),
    calcThroughDate: params.calculationThroughDate,
    manualOverrideRate: params.manualInterestRateOverride,
  });
}

/**
 * FTF_PENALTY_INTEREST_START_DATE_ASSUMPTION: per this application's
 * reading of IRC 6601(e)(2)(B), interest on the failure-to-file addition
 * begins ON the applicable filing due date itself (including a valid
 * extension) — one day earlier in relative terms than the unpaid-tax
 * stream's day-after convention, reflecting the statute's own carve-out
 * for this specific addition to tax. Confirm before relying on results.
 */
export function computeFtfPenaltyInterest(params: {
  filingDueDate: PlainDate;
  ftfPenaltyCurve: BalanceCurve;
  calculationThroughDate: PlainDate;
  manualInterestRateOverride?: Rate;
}): InterestResult {
  return computeCompoundInterestOverSegments({
    curve: params.ftfPenaltyCurve,
    accrualStartDate: params.filingDueDate,
    calcThroughDate: params.calculationThroughDate,
    manualOverrideRate: params.manualInterestRateOverride,
  });
}

export const FTP_PENALTY_INTEREST_GRACE_DAYS = 21;
export const FTP_PENALTY_INTEREST_GRACE_BUSINESS_DAYS_LARGE = 10;
export const FTP_PENALTY_INTEREST_LARGE_NOTICE_THRESHOLD = money(100000);

export interface FtpPenaltyInterestOutcome {
  result: InterestResult | OmittedInterestResult;
  gracePeriodMet: boolean;
  graceDeadline: PlainDate | null;
}

/**
 * Interest on the failure-to-pay penalty is NOT automatic merely because a
 * notice-and-demand date was entered. Per IRC 6601(e), no interest is
 * imposed if the penalty is paid in full within 21 calendar days of the
 * notice-and-demand date (10 business days if the amount stated in the
 * notice is $100,000 or more). Whether it was paid within that window is
 * derived directly from the ledger-tracked FTP-penalty balance curve
 * rather than asked as a separate yes/no question.
 */
export function computeFtpPenaltyInterest(params: {
  noticeAndDemandDate?: PlainDate;
  noticeAndDemandAmount?: Money;
  ftpPenaltyCurve: BalanceCurve;
  calculationThroughDate: PlainDate;
  manualInterestRateOverride?: Rate;
}): FtpPenaltyInterestOutcome {
  if (params.noticeAndDemandDate === undefined) {
    return {
      result: {
        omitted: true,
        reason: "Interest on the failure-to-pay penalty is not included because an applicable IRS notice-and-demand date was not entered.",
      },
      gracePeriodMet: false,
      graceDeadline: null,
    };
  }

  if (isZero(params.ftpPenaltyCurve.initial)) {
    return {
      result: { segments: [], totalInterest: ZERO, rateTableExceeded: false, exceededAtDate: null, manualOverrideRate: null },
      gracePeriodMet: false,
      graceDeadline: null,
    };
  }

  const noticeAmount = params.noticeAndDemandAmount ?? params.ftpPenaltyCurve.initial;
  const isLargeNotice = gte(noticeAmount, FTP_PENALTY_INTEREST_LARGE_NOTICE_THRESHOLD);
  const graceDeadline = isLargeNotice
    ? addBusinessDays(params.noticeAndDemandDate, FTP_PENALTY_INTEREST_GRACE_BUSINESS_DAYS_LARGE)
    : addDays(params.noticeAndDemandDate, FTP_PENALTY_INTEREST_GRACE_DAYS);

  const balanceAtDeadline = params.ftpPenaltyCurve.balanceAsOf(graceDeadline);
  if (isZeroOrNegative(balanceAtDeadline)) {
    return {
      result: { segments: [], totalInterest: ZERO, rateTableExceeded: false, exceededAtDate: null, manualOverrideRate: null },
      gracePeriodMet: true,
      graceDeadline,
    };
  }

  const result = computeCompoundInterestOverSegments({
    curve: params.ftpPenaltyCurve,
    accrualStartDate: params.noticeAndDemandDate,
    calcThroughDate: params.calculationThroughDate,
    manualOverrideRate: params.manualInterestRateOverride,
  });

  return { result, gracePeriodMet: false, graceDeadline };
}

export { isPositive };
