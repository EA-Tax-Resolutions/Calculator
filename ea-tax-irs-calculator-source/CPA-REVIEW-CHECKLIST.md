# CPA Review Checklist

For Anthony Fontana, CPA, to complete before this calculator is used publicly or with real clients.

## Calculation logic

- [ ] Confirm the failure-to-file-penalty interest start date (this app uses the applicable filing
      due date, including a valid extension) against current IRC § 6601(e)(2)(B) guidance and IRM
      20.2.5. See `CALCULATION-METHODOLOGY.md`.
- [ ] Confirm the daily-interest-rate divisor convention (actual/actual: 365, or 366 in a leap year)
      against 26 CFR § 301.6622-1 and IRM 20.2.5.
- [ ] Confirm the minimum-failure-to-file-penalty comparison (lesser of the statutory table amount,
      keyed to the original due date's year, or 100% of the unpaid tax) matches current IRS guidance.
- [ ] Confirm the failure-to-pay-penalty-interest grace period (21 calendar days, or 10 business days
      if the notice amount is $100,000 or more) against current IRC § 6601(e) guidance.
- [ ] Confirm the levy-notice 1% rate transition timing (first penalty month starting on/after the
      10-day statutory period elapses) against current IRM guidance.
- [ ] Spot-check at least 2–3 real (anonymized) client scenarios against this calculator's output and
      either an actual IRS transcript or commercial tax-resolution software, and record results.

## Data accuracy

- [ ] Re-verify the quarterly interest-rate table (`src/data/quarterlyInterestRates.ts`) against
      irs.gov/payments/quarterly-interest-rates.
- [ ] Re-verify the minimum failure-to-file penalty table
      (`src/data/minimumFailureToFilePenalties.ts`) against irs.gov/payments/failure-to-file-penalty.
- [ ] Confirm no future/unpublished quarter has been guessed anywhere in the data.

## Content and disclaimers

- [ ] Review all disclaimer language on the homepage, methodology page, privacy page, and terms page
      for accuracy and tone (no guarantees, no "pennies on the dollar" language, no scare tactics).
- [ ] Confirm the "Illustrative Balance if Selected Penalties Were Removed" section's language does
      not imply eligibility or a guaranteed outcome.
- [ ] Review the FAQ content on the homepage and the methodology page for accuracy.
- [ ] Confirm the author/reviewer byline and "last reviewed" date are current.

## Brand and design

- [ ] Confirm the primary green (`#1E9539`) and overall look match current firm branding
      expectations — see `BRAND-AUDIT.md` for how this was derived.
- [ ] Confirm the logo asset in `public/brand/` is the current, correct version of the firm logo.
- [ ] Do a visual pass in an actual browser (desktop and mobile) — the development environment used
      to build this could not capture screenshots; a human visual QA pass has not yet been done.

## Links and CTAs

- [ ] Confirm the Calendly URL (`https://calendly.com/ea-tax-resolutions/discovery-call`) is correct
      and active.
- [ ] Confirm the penalty-abatement page URL (`https://www.eataxresolutions.com/irs-penalty-abatement`)
      exists and is correct (create it if it does not yet exist).
- [ ] Confirm the main site URL (`https://www.eataxresolutions.com/`) links are correct.

## Deployment

- [ ] Confirm the intended production domain (`calculator.eataxresolutions.com`) and update
      `next.config.ts`/`layout.tsx`/`sitemap.ts`/`robots.ts` if it differs.
- [ ] Follow `DEPLOYMENT.md` to deploy to Vercel and connect the subdomain.
- [ ] Confirm the main Squarespace site links to the calculator once live.
