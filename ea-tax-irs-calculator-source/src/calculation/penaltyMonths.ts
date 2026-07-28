import type { PlainDate, DateRange } from "./dates";
import { addMonths, dayAfter, isAfter, isBefore, rangesOverlapDays } from "./dates";

/**
 * Shared "calendar-month-length block anchored to a due date" generator,
 * used identically by:
 *  - failure-to-pay's month-by-month rate/balance walk (anchored to
 *    originalPaymentDueDate)
 *  - failure-to-file's month-count (anchored to filingDueDate)
 * One implementation, not two, so the "month or part of a month" rule is
 * defined in exactly one place.
 *
 * Block n (1-indexed) = (anchorDate + (n-1) months + 1 day) .. (anchorDate + n months)
 * e.g. anchor April 15: block 1 = Apr16-May15, block 2 = May16-Jun15, ...
 *
 * A block counts in full the moment `throughDate` reaches even one day past
 * its start ("a return filed one day late creates one penalty month").
 */
export function generateMonthlyBlocks(
  anchorDate: PlainDate,
  throughDate: PlainDate,
  maxBlocks?: number,
): DateRange[] {
  const blocks: DateRange[] = [];
  if (!isAfter(throughDate, anchorDate)) {
    return blocks;
  }
  let index = 0;
  while (true) {
    const blockStart = dayAfter(addMonths(anchorDate, index));
    if (isAfter(blockStart, throughDate)) break;
    const blockEnd = addMonths(anchorDate, index + 1);
    blocks.push({ start: blockStart, end: blockEnd });
    index += 1;
    if (maxBlocks !== undefined && blocks.length >= maxBlocks) break;
  }
  return blocks;
}

export function overlapDays(a: DateRange, b: DateRange): number {
  return rangesOverlapDays(a, b);
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  return !isBefore(a.start, b.start) && !isAfter(a.start, b.start) && !isBefore(a.end, b.end) && !isAfter(a.end, b.end);
}
