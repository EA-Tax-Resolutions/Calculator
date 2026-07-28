import type { PlainDate } from "./dates";
import { daysBetween, isSameOrBefore } from "./dates";
import { add, gt, maxMoney, minMoney, multiplyRate, rate as toRate, subtractFloorZero, ZERO, type Money } from "./money";
import { generateMonthlyBlocks } from "./penaltyMonths";
import { ftpAmountOverlapping } from "./failureToPay";
import { lookupMinimumPenaltyAmount } from "@/data/minimumFailureToFilePenalties";
import type { FailureToFileMonthDetail, FailureToFileResult, PenaltyMonth } from "./types";

export const FTF_MONTHLY_RATE = toRate("0.05");
export const FTF_MAX_MONTHS = 5;
export const MINIMUM_PENALTY_DAYS_LATE_THRESHOLD = 60;

export interface CalculateFailureToFileInput {
  /** Applicable filing due date, extended if a valid extension was asserted. Anchors the month count and the 60-day test. */
  filingDueDate: PlainDate;
  /** The ORIGINAL (unextended) return due date. Used ONLY to select the statutory minimum-penalty dollar bracket. */
  originalDueDateForMinimumTable: PlainDate;
  returnFiled: boolean;
  actualFiledDate: PlainDate | null;
  taxRequiredToBeShown: Money;
  /** Timely payments/credits made on or before the ORIGINAL payment due date — reduces the FTF base. Post-due-date payments do not. */
  timelyPreDueDatePayments: Money;
  /** Failure-to-pay's own computed monthly breakdown, used for the dollar-for-dollar coordination reduction. */
  ftpMonthlyBreakdown: PenaltyMonth[];
}

export function calculateFailureToFilePenalty(input: CalculateFailureToFileInput): FailureToFileResult {
  const noPenalty: FailureToFileResult = {
    appliesAtAll: false,
    monthsLate: 0,
    grossTotal: ZERO,
    coordinationReduction: ZERO,
    netTotal: ZERO,
    minimumPenaltyApplied: false,
    minimumPenaltyAmount: null,
    finalAmount: ZERO,
    monthlyBreakdown: [],
  };

  if (!input.returnFiled || input.actualFiledDate === null) {
    // Not yet filed: no failure-to-file penalty can be computed yet (it is
    // only assessed once the return is filed, or would be estimated
    // differently as an ongoing accrual — out of scope for this estimate).
    return noPenalty;
  }

  if (isSameOrBefore(input.actualFiledDate, input.filingDueDate)) {
    return noPenalty; // filed timely (including any valid extension)
  }

  const ftfBase = subtractFloorZero(input.taxRequiredToBeShown, input.timelyPreDueDatePayments);

  const blocks = generateMonthlyBlocks(input.filingDueDate, input.actualFiledDate, FTF_MAX_MONTHS);
  const monthsLate = blocks.length;
  const grossPerMonth = multiplyRate(ftfBase, FTF_MONTHLY_RATE);

  const monthlyBreakdown: FailureToFileMonthDetail[] = [];
  let grossTotal = ZERO;
  let coordinationReduction = ZERO;
  let netTotal = ZERO;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const overlap = ftpAmountOverlapping(input.ftpMonthlyBreakdown, block);
    const net = gt(grossPerMonth, overlap) ? subtractFloorZero(grossPerMonth, overlap) : ZERO;
    grossTotal = add(grossTotal, grossPerMonth);
    coordinationReduction = add(coordinationReduction, minMoney(overlap, grossPerMonth));
    netTotal = add(netTotal, net);
    monthlyBreakdown.push({
      start: block.start,
      end: block.end,
      index: i + 1,
      grossAmount: grossPerMonth,
      ftpOverlapReduction: minMoney(overlap, grossPerMonth),
      netAmount: net,
    });
  }

  const daysLate = daysBetween(input.filingDueDate, input.actualFiledDate);
  const moreThan60DaysLate = daysLate > MINIMUM_PENALTY_DAYS_LATE_THRESHOLD;

  let minimumPenaltyApplied = false;
  let minimumPenaltyAmount: Money | null = null;
  let finalAmount = netTotal;

  if (moreThan60DaysLate) {
    const tableAmount = lookupMinimumPenaltyAmount(input.originalDueDateForMinimumTable);
    if (tableAmount !== null) {
      // The minimum penalty is the LESSER of the statutory table amount or
      // 100% of the unpaid tax (the underpayment) — never the full "tax
      // required to be shown" figure, per corrected guidance.
      minimumPenaltyAmount = minMoney(tableAmount, ftfBase);
      if (gt(minimumPenaltyAmount, netTotal)) {
        finalAmount = minimumPenaltyAmount;
        minimumPenaltyApplied = true;
      }
    }
  }

  return {
    appliesAtAll: true,
    monthsLate,
    grossTotal,
    coordinationReduction,
    netTotal,
    minimumPenaltyApplied,
    minimumPenaltyAmount,
    finalAmount,
    monthlyBreakdown,
  };
}
