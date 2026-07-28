# Calculation Methodology

**Reviewed by:** Anthony Fontana, CPA — former California Franchise Tax Board auditor.
**Last reviewed:** July 21, 2026.
**Calculator logic last updated:** July 21, 2026.

This document explains exactly what the calculator computes and how. It is the authoritative
reference for the source code in `src/calculation/*`; if the two ever disagree, the code's behavior
is what actually ships, and this document should be corrected to match (or the code fixed — see
`SOURCE-UPDATE-CHECKLIST.md`).

## What this calculator includes

- Federal individual income tax (Form 1040), tax shown on the return.
- Failure-to-file penalty, IRC § 6651(a)(1).
- Failure-to-pay penalty, IRC § 6651(a)(2).
- Interest on unpaid tax, IRC §§ 6601, 6621, 6622.
- Interest on the failure-to-file penalty (a specific statutory exception, see below).
- Interest on the failure-to-pay penalty, only when a notice-and-demand date is supplied and the
  IRC § 6601(e) grace period was not satisfied.
- Partial payments entered by date, applied via a stated-assumption ledger (see below).
- An illustrative "penalties removed" scenario, explicitly not an abatement determination.

## What this calculator excludes

Estimated-tax penalties (IRC § 6654) and Form 2210; accuracy-related penalties; fraud penalties;
payroll-tax and failure-to-deposit penalties; Trust Fund Recovery Penalties; partnership and S
corporation penalties; corporate income tax; substitute-for-return cases; audit deficiencies;
bankruptcy periods; interest suspensions; disaster or combat-zone postponements; restricted-interest
cases; collection-statute calculations; and any California FTB liability. There is no "IRS or FTB"
toggle — this is a federal-only tool by design, architected so a separate California module could be
added later without reusing IRS rules for California penalties.

## Failure-to-file methodology

1. If the return was filed on or before the applicable filing due date (the original date, or the
   extended date if a valid extension is asserted), no failure-to-file penalty applies.
2. Otherwise, the penalty base (`ftfBase`) is the tax required to be shown on the return, reduced by
   payments/credits/withholding made on or before the **original** payment due date. Payments made
   after the original due date never reduce this base.
3. Months late are counted in calendar-month blocks anchored to the filing due date (e.g., due
   April 15 → blocks are April 16–May 15, May 16–June 15, ...); any part of a block counts as a full
   month. Capped at 5 months.
4. Gross penalty = 5% × `ftfBase` × months late.
5. **Coordination with failure-to-pay:** for each failure-to-file month, the gross penalty for that
   month is reduced, dollar for dollar, by whatever failure-to-pay penalty was **actually imposed**
   for the overlapping calendar month — regardless of whether that month's failure-to-pay rate was
   the standard 0.5%, the reduced 0.25% (installment agreement), or the increased 1% (levy notice).
   This application does not hardcode a fixed combined rate (such as 4.5%) anywhere; the reduction is
   always looked up from failure-to-pay's own actual per-month dollar amounts.
6. **Minimum penalty:** if the return is filed more than 60 days after the applicable filing due date
   (including a valid extension), the penalty is not less than the lesser of (a) a statutory dollar
   amount, or (b) 100% of the unpaid tax (`ftfBase` — the underpayment, never the full tax shown).
   The statutory dollar amount is selected from `src/data/minimumFailureToFilePenalties.ts` by the
   **original** (unextended) due date's year — a different date anchor than the 60-day test itself,
   which uses the extended deadline. Both anchors are threaded through distinctly in
   `failureToFile.ts` and covered by dedicated tests.

## Failure-to-pay methodology

1. Runs from the day after the **original** payment due date (a filing extension never extends this),
   in the same calendar-month blocks as above.
2. Standard rate: 0.5% per month or part of a month, applied to the unpaid balance **immediately
   before** each month begins. A payment landing inside a month reduces the balance for later months
   but not that month's own charge.
3. Reduced rate (0.25%) applies to a month only if **all three** hold: the taxpayer is an individual,
   the return was filed timely (including a valid extension), and an approved installment agreement
   covers that month. An installment-agreement date alone, without timely filing, never triggers the
   reduced rate.
4. Increased rate (1%) applies starting with the first month whose **start date** falls on or after
   10 calendar days following an IRS notice of intent to levy — not the month that merely contains
   that 10-day threshold date. (Worked example: due April 15, levy notice July 10 → threshold July
   20. July's block starts July 16, before the threshold, so it stays standard; August's block starts
   August 16, on/after the threshold, so it is the first 1% month.)
5. Capped at 25% of the underpayment (the same base as failure-to-file's `ftfBase`). The month that
   would cross 25% is truncated to land at exactly 25%, and no further months are evaluated — this
   dollar cap is a different concept from the "full month for any part of a month" rate rule above.

## Interest methodology

- **Interest on unpaid tax** begins the day after the original payment due date and compounds daily
  using the exact closed-form `principal × (1 + dailyRate)^days` (via `decimal.js`, never native
  floating-point math), applied per atomic segment — a segment being the intersection of IRS
  quarterly-rate boundaries, payment dates, and calendar-year boundaries. The running balance genuinely
  compounds across segments (interest earns interest), consistent with IRC § 6622.
- **Interest on the failure-to-file penalty** begins on the applicable filing due date itself
  (including a valid extension) — this application's reading of IRC § 6601(e)(2)(B)'s carve-out for
  this specific addition to tax. **This interpretation should be confirmed by a reviewing CPA before
  the result is relied upon**; the app surfaces a permanent warning to this effect.
- **Interest on the failure-to-pay penalty** is included only when a notice-and-demand date is
  entered, and only for the portion of the period during which IRC § 6601(e)'s grace period was not
  satisfied: no interest is imposed if the penalty is paid in full within 21 calendar days of the
  notice-and-demand date (10 business days if the amount stated in the notice is $100,000 or more).
  Whether the grace period was met is derived from the payment-ledger cascade (below), not asked as a
  separate yes/no question. If not met, interest accrues from the notice-and-demand date on the
  ledger-tracked (possibly declining) remaining penalty balance.
- **Daily-rate convention:** annual rate ÷ 365, or ÷ 366 in a leap year (actual/actual). This is the
  convention implemented; it should be confirmed against 26 CFR § 301.6622-1 and IRM 20.2.5 before
  results are relied upon — the app surfaces a permanent warning to this effect, and the divisor is
  defined in exactly one place (`dates.ts#daysInYear`) so a correction is a one-line change.
- **Rate-table cutoff:** once the calculation-through date exceeds the last verified quarterly rate
  (currently Q3 2026), interest stops accruing and a warning is shown, rather than silently carrying
  the last known rate forward. An optional, clearly-labeled manual override rate can be supplied for
  the period beyond the cutoff.

## Payment ledger and interaction with interest

Each payment cascades through ordered buckets: remaining unpaid tax principal, then the
failure-to-file penalty principal, then the failure-to-pay penalty principal, then accrued interest
on each of those in the same order. **This exact order is a disclosed, stated assumption** — the
actual IRS may apply a payment differently based on transcript transactions, designated-payment
elections, assessments, credits, reversals, and account history, and the application always
discloses this.

Critically, once a payment's cascade reduces a penalty's principal, that penalty's own interest
calculation is run against the **reduced** principal from the payment date forward — a payment that
pays down part of the failure-to-file penalty genuinely stops interest on that paid portion as of the
payment date, while interest on the remaining unpaid portion continues. This is verified by a
dedicated regression test (`tests/unit/gate-5-ledger-cascade.test.ts`).

## Rounding

All arithmetic uses `decimal.js` at 50 significant digits of precision — never native JavaScript
floating-point numbers, which cannot represent values like 0.005 exactly. Intermediate values (daily
interest accrual, per-month penalty amounts, coordination reductions) are **never** rounded. Rounding
to the cent happens only once, at the point where the final `EstimateTotals` object is assembled —
and every displayed total (like "Total estimated interest") is computed as the sum of the
**already-rounded** displayed line items, not as an independently-rounded full-precision sum. This
guarantees the numbers a user sees always add up exactly by hand, even though it is a fractional cent
less "mathematically pure" than summing full precision and rounding once.

## Missing-data warnings

The engine surfaces a closed, typed set of warnings (`src/calculation/warnings.ts`) rather than
ad-hoc strings, including: the rate-table cutoff, the two statutory-interpretation assumptions above,
the payment-allocation-order assumption, a duplicate-payment-date merge notice, a minimum-penalty
applied notice, an installment-agreement/levy-notice overlap notice, and the illustrative-scenario
disclaimer. All are shown in the "Warnings and assumptions" section of the calculation details.

## Source verification dates

- Quarterly interest rates: verified July 21, 2026, directly against irs.gov/payments/quarterly-interest-rates, covering Q1 2017–Q3 2026.
- Minimum failure-to-file penalty table: verified July 21, 2026, against irs.gov/payments/failure-to-file-penalty.
- See `OFFICIAL-SOURCES.md` for the full source list and `SOURCE-UPDATE-CHECKLIST.md` for how to keep this current.
