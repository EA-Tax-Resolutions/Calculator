import { parseISODate, isSameOrBefore, isSameOrAfter, type PlainDate } from "@/calculation/dates";
import { rate, type Rate } from "@/calculation/money";

/**
 * IRS quarterly underpayment interest rates for non-corporate taxpayers
 * (individuals), under IRC Section 6621(a)(2) — federal short-term rate
 * plus 3 percentage points, rounded to the nearest full percent, set each
 * calendar quarter by IRS Revenue Ruling.
 *
 * SOURCE (official government authority only, per project policy — no
 * third-party rate table is used as a source for shipped data):
 *   https://www.irs.gov/payments/quarterly-interest-rates
 *
 * Coverage: Q1 2017 through Q3 2026, the full range directly confirmed
 * against the IRS.gov quarterly-interest-rates page itself on the
 * verification date below. Earlier quarters exist but are intentionally
 * NOT included, since they were only cross-checked against a third-party
 * summary during development, not an official source — see
 * SOURCE-UPDATE-CHECKLIST.md to extend this table backward with an actual
 * Revenue Ruling citation.
 *
 * IMPORTANT ON CITATIONS: every row's rate percentage was read directly
 * from the IRS.gov summary page above. The specific per-quarter Revenue
 * Ruling number is only recorded where it was independently confirmed
 * (see the two rows with a `citation` value); all other rows cite the
 * summary page only (`citation: null`) rather than guess a Revenue Ruling
 * number that was never actually looked up — do not fill these in without
 * confirming each one individually (SOURCE-UPDATE-CHECKLIST.md explains how).
 *
 * Do NOT guess or extrapolate an unpublished future quarter. When a
 * calculation-through date extends beyond the last row here, the interest
 * engine stops and surfaces a warning (see RATE_TABLE_EXCEEDED).
 */
export interface QuarterlyRateRow {
  quarterStart: string;
  quarterEnd: string;
  annualRatePercent: number;
  sourceUrl: string;
  citation: string | null;
  verifiedDate: string;
}

export const VERIFIED_DATE = "2026-07-21";
export const SOURCE_URL = "https://www.irs.gov/payments/quarterly-interest-rates";

export const QUARTERLY_INTEREST_RATES: QuarterlyRateRow[] = [
  { quarterStart: "2017-01-01", quarterEnd: "2017-03-31", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2017-04-01", quarterEnd: "2017-06-30", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2017-07-01", quarterEnd: "2017-09-30", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2017-10-01", quarterEnd: "2017-12-31", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2018-01-01", quarterEnd: "2018-03-31", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2018-04-01", quarterEnd: "2018-06-30", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: "Rev. Rul. 2018-07 (irs.gov/pub/irs-drop/rr-18-07.pdf)", verifiedDate: VERIFIED_DATE },
  { quarterStart: "2018-07-01", quarterEnd: "2018-09-30", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2018-10-01", quarterEnd: "2018-12-31", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2019-01-01", quarterEnd: "2019-03-31", annualRatePercent: 6, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2019-04-01", quarterEnd: "2019-06-30", annualRatePercent: 6, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2019-07-01", quarterEnd: "2019-09-30", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2019-10-01", quarterEnd: "2019-12-31", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2020-01-01", quarterEnd: "2020-03-31", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2020-04-01", quarterEnd: "2020-06-30", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2020-07-01", quarterEnd: "2020-09-30", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2020-10-01", quarterEnd: "2020-12-31", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2021-01-01", quarterEnd: "2021-03-31", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2021-04-01", quarterEnd: "2021-06-30", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2021-07-01", quarterEnd: "2021-09-30", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2021-10-01", quarterEnd: "2021-12-31", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2022-01-01", quarterEnd: "2022-03-31", annualRatePercent: 3, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2022-04-01", quarterEnd: "2022-06-30", annualRatePercent: 4, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2022-07-01", quarterEnd: "2022-09-30", annualRatePercent: 5, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2022-10-01", quarterEnd: "2022-12-31", annualRatePercent: 6, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2023-01-01", quarterEnd: "2023-03-31", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2023-04-01", quarterEnd: "2023-06-30", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2023-07-01", quarterEnd: "2023-09-30", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2023-10-01", quarterEnd: "2023-12-31", annualRatePercent: 8, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2024-01-01", quarterEnd: "2024-03-31", annualRatePercent: 8, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2024-04-01", quarterEnd: "2024-06-30", annualRatePercent: 8, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2024-07-01", quarterEnd: "2024-09-30", annualRatePercent: 8, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2024-10-01", quarterEnd: "2024-12-31", annualRatePercent: 8, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2025-01-01", quarterEnd: "2025-03-31", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2025-04-01", quarterEnd: "2025-06-30", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2025-07-01", quarterEnd: "2025-09-30", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2025-10-01", quarterEnd: "2025-12-31", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },

  { quarterStart: "2026-01-01", quarterEnd: "2026-03-31", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: "Rev. Rul. 2025-22 (irs.gov/pub/irs-drop/rr-25-22.pdf)", verifiedDate: VERIFIED_DATE },
  { quarterStart: "2026-04-01", quarterEnd: "2026-06-30", annualRatePercent: 6, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
  { quarterStart: "2026-07-01", quarterEnd: "2026-09-30", annualRatePercent: 7, sourceUrl: SOURCE_URL, citation: null, verifiedDate: VERIFIED_DATE },
];

export interface ResolvedQuarterlyRate {
  rate: Rate;
  verified: boolean;
  quarterLabel: string;
  quarterStart: PlainDate;
  quarterEnd: PlainDate;
}

const parsedRows = QUARTERLY_INTEREST_RATES.map((row) => ({
  ...row,
  start: parseISODate(row.quarterStart),
  end: parseISODate(row.quarterEnd),
}));

export function getLastVerifiedQuarterEnd(): PlainDate {
  const last = parsedRows[parsedRows.length - 1];
  if (!last) throw new Error("QUARTERLY_INTEREST_RATES table is empty");
  return last.end;
}

/**
 * Looks up the verified quarterly rate for a given date. Returns null if
 * the date falls before the table's first row or after the last verified
 * row — callers must treat both as "no verified rate available" rather
 * than silently defaulting to some nearby quarter's rate.
 */
export function getQuarterlyRate(date: PlainDate): ResolvedQuarterlyRate | null {
  for (const row of parsedRows) {
    if (isSameOrBefore(row.start, date) && isSameOrAfter(row.end, date)) {
      return {
        rate: rate(row.annualRatePercent).dividedBy(100) as Rate,
        verified: true,
        quarterLabel: `${row.start.year} Q${Math.floor((row.start.month - 1) / 3) + 1}`,
        quarterStart: row.start,
        quarterEnd: row.end,
      };
    }
  }
  return null;
}
