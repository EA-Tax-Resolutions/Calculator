import { parseISODate, isSameOrBefore, isSameOrAfter, type PlainDate } from "@/calculation/dates";
import { money, type Money } from "@/calculation/money";

/**
 * Minimum failure-to-file penalty under IRC Section 6651(a), applied when
 * a return is filed more than 60 days after the applicable filing due date
 * (including a valid extension). The minimum penalty itself is the LESSER
 * of the statutory dollar amount below OR 100% of the unpaid tax — the
 * dollar figure here is only one side of that comparison, selected by the
 * ORIGINAL (unextended) return due date, per failureToFile.ts.
 *
 * SOURCE (official government authority only):
 *   https://www.irs.gov/payments/failure-to-file-penalty
 */
export interface MinimumPenaltyRow {
  effectiveStart: string;
  effectiveEnd: string | null;
  amount: number;
  sourceUrl: string;
  verifiedDate: string;
}

const SOURCE_URL = "https://www.irs.gov/payments/failure-to-file-penalty";
const VERIFIED_DATE = "2026-07-21";

export const MINIMUM_FAILURE_TO_FILE_PENALTIES: MinimumPenaltyRow[] = [
  { effectiveStart: "2009-01-01", effectiveEnd: "2015-12-31", amount: 135, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2016-01-01", effectiveEnd: "2017-12-31", amount: 205, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2018-01-01", effectiveEnd: "2019-12-31", amount: 210, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2020-01-01", effectiveEnd: "2022-12-31", amount: 435, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2023-01-01", effectiveEnd: "2023-12-31", amount: 450, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2024-01-01", effectiveEnd: "2024-12-31", amount: 485, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2025-01-01", effectiveEnd: "2025-12-31", amount: 510, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
  { effectiveStart: "2026-01-01", effectiveEnd: null, amount: 525, sourceUrl: SOURCE_URL, verifiedDate: VERIFIED_DATE },
];

const parsedRows = MINIMUM_FAILURE_TO_FILE_PENALTIES.map((row) => ({
  ...row,
  start: parseISODate(row.effectiveStart),
  end: row.effectiveEnd ? parseISODate(row.effectiveEnd) : null,
}));

/**
 * Looks up the statutory minimum-penalty dollar amount for a return whose
 * ORIGINAL (unextended) due date is `originalDueDate`. Returns null if the
 * date falls before the table's earliest row (2009) — callers should treat
 * that as "no minimum-penalty data available" rather than defaulting.
 */
export function lookupMinimumPenaltyAmount(originalDueDate: PlainDate): Money | null {
  for (const row of parsedRows) {
    const afterStart = isSameOrBefore(row.start, originalDueDate);
    const beforeEnd = row.end === null || isSameOrAfter(row.end, originalDueDate);
    if (afterStart && beforeEnd) {
      return money(row.amount);
    }
  }
  return null;
}
