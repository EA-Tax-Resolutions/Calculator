import type { PlainDate, DateRange } from "./dates";
import { isSameOrAfter, isSameOrBefore, addDays, rangesOverlapDays, rangeDays } from "./dates";
import {
  add,
  gt,
  minMoney,
  multiplyRate,
  rate as toRate,
  subtractFloorZero,
  ZERO,
  isZeroOrNegative,
  type Money,
  type Rate,
} from "./money";
import { generateMonthlyBlocks } from "./penaltyMonths";
import type { BalanceCurve, FailureToPayResult, InstallmentAgreementInput, PenaltyMonth, RateReason } from "./types";

export const STANDARD_FTP_RATE = toRate("0.005");
export const INSTALLMENT_AGREEMENT_FTP_RATE = toRate("0.0025");
export const LEVY_NOTICE_FTP_RATE = toRate("0.01");
export const FTP_CAP_FRACTION = toRate("0.25");
export const LEVY_NOTICE_GRACE_DAYS = 10;

export interface FtpRateContext {
  installmentAgreement?: InstallmentAgreementInput;
  wasFiledTimely: boolean;
  levyNoticeDate?: PlainDate;
}

export interface ResolvedFtpRate {
  rate: Rate;
  reason: RateReason;
  ambiguousIaAndLevy: boolean;
}

/**
 * Resolves the failure-to-pay rate that applies to a whole penalty month
 * block. Rates are never prorated within a block (rule: "do not prorate
 * monthly rate changes") — whichever rate governs at the block's START
 * applies for the entire block.
 */
export function resolveFtpRateForMonth(block: DateRange, ctx: FtpRateContext): ResolvedFtpRate {
  const iaActive =
    ctx.installmentAgreement !== undefined &&
    ctx.wasFiledTimely &&
    isSameOrAfter(block.start, ctx.installmentAgreement.approvedDate) &&
    (ctx.installmentAgreement.endDate === undefined || isSameOrBefore(block.start, ctx.installmentAgreement.endDate));

  // The 1% levy rate applies starting with the first block whose START
  // date is on/after (levyNoticeDate + 10 days) — NOT the block that
  // merely CONTAINS that threshold date. See CALCULATION-METHODOLOGY.md
  // for the worked IRM example this guards against (due Apr 15, notice
  // Jul 10 -> threshold Jul 20 -> first 1% block starts Aug 16, not Jul 16,
  // because July's block already started Jul 16, before the threshold).
  const levyActive =
    ctx.levyNoticeDate !== undefined &&
    isSameOrAfter(block.start, addDays(ctx.levyNoticeDate, LEVY_NOTICE_GRACE_DAYS));

  if (levyActive) {
    return { rate: LEVY_NOTICE_FTP_RATE, reason: "levy_notice", ambiguousIaAndLevy: iaActive };
  }
  if (iaActive) {
    return { rate: INSTALLMENT_AGREEMENT_FTP_RATE, reason: "installment_agreement", ambiguousIaAndLevy: false };
  }
  return { rate: STANDARD_FTP_RATE, reason: "standard", ambiguousIaAndLevy: false };
}

export interface CalculateFailureToPayInput {
  originalPaymentDueDate: PlainDate;
  calculationThroughDate: PlainDate;
  capBase: Money;
  taxCurve: BalanceCurve;
  installmentAgreement?: InstallmentAgreementInput;
  wasFiledTimely: boolean;
  levyNoticeDate?: PlainDate;
}

export interface CalculateFailureToPayOutput extends FailureToPayResult {
  anyIaAndLevyAmbiguity: boolean;
}

export function calculateFailureToPayPenalty(input: CalculateFailureToPayInput): CalculateFailureToPayOutput {
  const capLimit = multiplyRate(input.capBase, FTP_CAP_FRACTION);
  const blocks = generateMonthlyBlocks(input.originalPaymentDueDate, input.calculationThroughDate);

  let cumulative = ZERO;
  let cappedAt25Percent = false;
  let anyIaAndLevyAmbiguity = false;
  const monthlyBreakdown: PenaltyMonth[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const dayBeforeBlockStart = addDays(block.start, -1);
    const balanceAtStart = input.taxCurve.balanceAsOf(dayBeforeBlockStart);

    if (isZeroOrNegative(balanceAtStart)) {
      // Balance is already fully paid; it can only stay at zero or lower
      // from here (payments never increase it), so no further blocks
      // contribute any charge.
      break;
    }

    const resolved = resolveFtpRateForMonth(block, {
      installmentAgreement: input.installmentAgreement,
      wasFiledTimely: input.wasFiledTimely,
      levyNoticeDate: input.levyNoticeDate,
    });
    if (resolved.ambiguousIaAndLevy) anyIaAndLevyAmbiguity = true;

    const candidate = multiplyRate(balanceAtStart, resolved.rate);
    let charge = candidate;
    if (gt(add(cumulative, candidate), capLimit)) {
      charge = subtractFloorZero(capLimit, cumulative);
      cappedAt25Percent = true;
    }

    cumulative = add(cumulative, charge);
    monthlyBreakdown.push({
      start: block.start,
      end: block.end,
      index: i + 1,
      balanceAtStart,
      rate: resolved.rate,
      rateReason: resolved.reason,
      amount: charge,
      cumulativeAfter: cumulative,
    });

    if (cappedAt25Percent) break;
  }

  return {
    monthlyBreakdown,
    totalAmount: cumulative,
    cappedAt25Percent,
    capBase: input.capBase,
    anyIaAndLevyAmbiguity,
  };
}

/** Total failure-to-pay dollars actually imposed that overlap a given date range (calendar-day overlap), for FTF coordination. */
export function ftpAmountOverlapping(ftpMonths: PenaltyMonth[], range: DateRange): Money {
  let total = ZERO;
  for (const m of ftpMonths) {
    const overlap = rangesOverlapDays(m, range);
    if (overlap <= 0) continue;
    const monthLength = rangeDays(m);
    if (overlap >= monthLength) {
      total = add(total, m.amount);
    } else {
      // Partial overlap (nonstandard extension misalignment) — apportion by day count.
      total = add(total, minMoney(m.amount, multiplyRate(m.amount, toRate(overlap).dividedBy(monthLength) as Rate)));
    }
  }
  return total;
}
