# Known Limitations

This calculator produces an **estimate**, never an exact IRS balance. The following limitations are
known and deliberate scope boundaries, not oversights — but they should all be understood before
relying on this tool for a real client matter.

## Scope limitations (by design, see CALCULATION-METHODOLOGY.md)

- Federal individual (Form 1040) tax only — no California FTB, no other states, no business returns.
- Does not model: estimated-tax penalties (6654)/Form 2210, accuracy-related or fraud penalties,
  payroll-tax or failure-to-deposit penalties, Trust Fund Recovery Penalties, partnership/S-corp
  penalties, corporate tax, substitute-for-return cases, audit deficiencies, bankruptcy periods,
  interest suspensions, disaster or combat-zone postponements, restricted-interest cases, or
  collection-statute expiration.

## Modeling simplifications

- **Payment allocation order is a stated assumption** (tax → failure-to-file penalty →
  failure-to-pay penalty → interest on each, in that order). The real IRS may apply a payment
  differently based on transcript-specific facts, designated-payment elections, assessment timing,
  credits, and reversals.
- **Excess payments beyond all three principal buckets** (a rare case — a payment large enough to
  fully satisfy tax, the failure-to-file penalty, and the failure-to-pay penalty, with cash left
  over) are netted against already-computed interest totals for ledger display purposes only. This
  does not recursively re-trigger interest-on-interest recompounding for that excess; it is a
  bounded simplification for an edge case, not the primary use case this tool is designed around.
- **Business-day calculation** (used for the $100,000-or-more failure-to-pay-penalty-interest grace
  period) counts Monday–Friday only; federal holidays are not modeled, so a grace-period deadline
  falling near a federal holiday may be off by one business day from the IRS's actual calculation.
- **Installment-agreement/levy-notice overlap:** if both an active installment agreement and a
  qualifying levy-notice condition are indicated for the same month, the engine resolves to the
  levy-notice 1% rate and surfaces a warning — this combination should not occur in real IRS
  practice (an active installment agreement ordinarily precludes issuance of a levy notice), so its
  presence in your inputs likely indicates a data-entry issue worth double-checking.
- **Nonstandard extension dates:** if a failure-to-file penalty month and a failure-to-pay penalty
  month don't align on the same calendar boundaries (which can happen with a nonstandard extension
  date), the coordination reduction is apportioned by day count and a warning is shown rather than
  silently assuming perfect alignment.

## Interpretive assumptions flagged for CPA review

Two statutory interpretations are implemented with a specific, documented reading, but are flagged
in-app and in `CALCULATION-METHODOLOGY.md` as items a reviewing CPA should confirm before reliance:

1. The start date for interest on the failure-to-file penalty (this app's reading of IRC §
   6601(e)(2)(B): the applicable filing due date, including a valid extension).
2. The daily-interest-rate divisor convention (actual/actual: 365, or 366 in a leap year).

## Data currency

- The quarterly interest-rate table is verified only through Q3 2026 as of this writing. Any
  calculation extending beyond that date will show a "rate table exceeded" warning and requires
  either accepting the calculation as stopping there, or supplying a manual, clearly-labeled
  override rate for the remainder — this is intentional; the app will not silently guess an
  unpublished future rate.
- The minimum failure-to-file penalty table only goes back to 2009. Calculations involving an
  original due date before 2009 are not supported.
- The quarterly interest-rate table's shipped range starts at Q1 2017 (not earlier) because earlier
  quarters were only cross-checked against a third-party source during development, not an official
  government citation — see `SOURCE-UPDATE-CHECKLIST.md` to extend it backward properly.

## Environment limitations encountered during this build

- The development environment's browser-automation tooling could not capture screenshots (a
  persistent tool timeout unrelated to the application itself), so the brand audit and visual QA in
  this repository were performed via computed-style DOM inspection, direct logo pixel-sampling, and
  accessibility-tree/text extraction rather than visual screenshot comparison. A human reviewer with
  working screenshot tooling should do a final visual pass before launch.
- The project's working directory name contains an ampersand (`Interest & Penalty Calculator`),
  which breaks Windows's `npm.cmd`/`npx.cmd` batch-file shims (a Windows/npm quoting issue, not a
  code issue) — `package.json` scripts should still be invoked via `npm run <script>` in a normal
  terminal, but if that ever fails on Windows with a "not recognized as an internal or external
  command" error, invoke the underlying binary directly via `node ./node_modules/<pkg>/...` as a
  workaround (see `playwright.config.ts` for a working example), or rename the project folder to
  remove the ampersand.
