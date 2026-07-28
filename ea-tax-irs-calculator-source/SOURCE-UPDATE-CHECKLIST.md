# Source Update Checklist

Follow this checklist each quarter (interest rates) and whenever the IRS publishes an inflation
adjustment (minimum penalty), or at least annually.

## 1. Check the IRS quarterly interest rate

1. Visit https://www.irs.gov/payments/quarterly-interest-rates directly (do not rely on a cached
   summary or a third-party site).
2. Find the "Individuals" (non-corporate) rate for the newest quarter.
3. Note the exact date range and rate percentage.

## 2. Add a new quarter

1. Open `src/data/quarterlyInterestRates.ts`.
2. Append a new row to `QUARTERLY_INTEREST_RATES`:
   ```ts
   { quarterStart: "YYYY-MM-DD", quarterEnd: "YYYY-MM-DD", annualRatePercent: N, sourceUrl: SOURCE_URL, citation: null, verifiedDate: "YYYY-MM-DD" }
   ```
3. If you can identify the specific Revenue Ruling number for that quarter (check
   https://www.irs.gov/irb for the relevant Internal Revenue Bulletin), set `citation` to a string
   naming it — otherwise leave it `null` rather than guessing. **Never invent a citation number.**
4. Update the `VERIFIED_DATE` constant to today's date.
5. Update the "last verified quarter" references in `CALCULATION-METHODOLOGY.md` and
   `OFFICIAL-SOURCES.md`.

## 3. Verify minimum failure-to-file penalty changes

1. Visit https://www.irs.gov/payments/failure-to-file-penalty and check the current minimum penalty
   dollar amount and its effective date range.
2. The IRS typically publishes this figure via an annual inflation-adjustment revenue procedure —
   check https://www.irs.gov/irb for the relevant Revenue Procedure if you want a precise statutory
   citation.
3. If a new bracket has taken effect, add a new row to `MINIMUM_FAILURE_TO_FILE_PENALTIES` in
   `src/data/minimumFailureToFilePenalties.ts`, and close out the previous row's `effectiveEnd` date.

## 4. Record the source and verification date

Every data row in both files above must carry a `sourceUrl` and `verifiedDate`. Never merge a data
change without both fields set. If you're extending the interest-rate table backward (before 2017),
do not use the third-party cross-check table from development — locate the actual Revenue Ruling for
each quarter and cite it directly.

## 5. Run regression tests

```
npm test
```

All existing tests, especially the six Stage-1 gate tests in `tests/unit/gate-*.test.ts`, must
remain green after any data change. If a data change causes a previously-passing test to fail,
that's a signal the test's expected values were tied to the specific rate you just changed — update
the test's expected values deliberately (never silently), and note why in the commit message.

## 6. Review official IRM changes

Periodically re-read:
- IRM 20.1.2 (failure-to-file/failure-to-pay penalties)
- IRM 20.2.5 (interest on underpayments)

for any procedural changes that might affect the assumptions documented in
`CALCULATION-METHODOLOGY.md` (especially the two flagged interpretive assumptions: the
failure-to-file-penalty interest start date under IRC § 6601(e)(2)(B), and the actual/actual
leap-year daily-rate convention). If IRM guidance clarifies either point, update both the code
comment at the relevant call site and the methodology document together.

## 7. Compare against professional software or an IRS transcript

Before relying on this calculator for a real client matter, run at least one real (anonymized)
scenario through both this calculator and either commercial tax-resolution software or an actual IRS
account transcript, and compare figures line by line. Document any discrepancy found, and file it as
a `KNOWN-LIMITATIONS.md` entry or a code fix as appropriate.
