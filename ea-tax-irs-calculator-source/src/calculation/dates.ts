import { Temporal } from "@js-temporal/polyfill";

/**
 * All tax-calendar date math goes through Temporal.PlainDate, never the
 * legacy JS Date object. Date has no calendar-safe "add N months" operation
 * and is prone to timezone-related off-by-one-day bugs; PlainDate has
 * neither timezone nor time-of-day, matching how the IRS actually reasons
 * about due dates (a date, not an instant).
 */

export type PlainDate = Temporal.PlainDate;

export function parseISODate(s: string): PlainDate {
  return Temporal.PlainDate.from(s);
}

export function toISOString(d: PlainDate): string {
  return d.toString();
}

export function dayAfter(d: PlainDate): PlainDate {
  return d.add({ days: 1 });
}

export function addDays(d: PlainDate, days: number): PlainDate {
  return days >= 0 ? d.add({ days }) : d.subtract({ days: -days });
}

/**
 * Adds calendar months using Temporal's "constrain" overflow (the default),
 * so Jan 31 + 1 month lands on Feb 28/29 rather than throwing. This matters
 * for penalty-month generation anchored to due dates near month-end.
 */
export function addMonths(d: PlainDate, months: number): PlainDate {
  return d.add({ months });
}

export function isBefore(a: PlainDate, b: PlainDate): boolean {
  return Temporal.PlainDate.compare(a, b) < 0;
}

export function isAfter(a: PlainDate, b: PlainDate): boolean {
  return Temporal.PlainDate.compare(a, b) > 0;
}

export function isSameOrBefore(a: PlainDate, b: PlainDate): boolean {
  return Temporal.PlainDate.compare(a, b) <= 0;
}

export function isSameOrAfter(a: PlainDate, b: PlainDate): boolean {
  return Temporal.PlainDate.compare(a, b) >= 0;
}

export function isEqual(a: PlainDate, b: PlainDate): boolean {
  return Temporal.PlainDate.compare(a, b) === 0;
}

export function minDate(a: PlainDate, b: PlainDate): PlainDate {
  return isBefore(a, b) ? a : b;
}

export function maxDate(a: PlainDate, b: PlainDate): PlainDate {
  return isAfter(a, b) ? a : b;
}

/** Whole calendar days between two dates (end - start), can be negative. */
export function daysBetween(start: PlainDate, end: PlainDate): number {
  return start.until(end, { largestUnit: "days" }).days;
}

export function startOfYear(year: number): PlainDate {
  return Temporal.PlainDate.from({ year, month: 1, day: 1 });
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Days in the calendar year containing `d` — used as the divisor for the
 * actual/actual daily-interest-rate convention (annualRate / daysInYear).
 * FLAGGED ASSUMPTION: this is the convention this app implements; the exact
 * IRS/Treasury methodology under 26 CFR 301.6622-1 should be confirmed by a
 * reviewer (see LEAP_YEAR_CONVENTION_ASSUMPTION in warnings.ts). Every call
 * site for the leap-year divisor goes through this one function so the
 * convention is a single-line change if correction is needed.
 */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** Adds N business days (Mon-Fri only; federal holidays not modeled — see KNOWN-LIMITATIONS.md). */
export function addBusinessDays(d: PlainDate, businessDays: number): PlainDate {
  let result = d;
  let remaining = businessDays;
  while (remaining > 0) {
    result = result.add({ days: 1 });
    // dayOfWeek: 1 = Monday ... 7 = Sunday
    if (result.dayOfWeek <= 5) {
      remaining -= 1;
    }
  }
  return result;
}

export interface DateRange {
  start: PlainDate;
  end: PlainDate;
}

export function rangesOverlapDays(a: DateRange, b: DateRange): number {
  const start = maxDate(a.start, b.start);
  const end = minDate(a.end, b.end);
  if (isAfter(start, end)) return 0;
  return daysBetween(start, end) + 1;
}

export function rangeDays(r: DateRange): number {
  return daysBetween(r.start, r.end) + 1;
}
