# Official Sources

Every source cited in this application's data files, methodology documentation, and in-app source
lists is a primary government authority: IRS.gov, the Internal Revenue Code (mirrored at Cornell
Law's Legal Information Institute), the Internal Revenue Manual, or the Electronic Code of Federal
Regulations. No third-party summary, tax-preparation-company blog, or commentary site is used as a
calculation authority anywhere in this application.

## Failure-to-file penalty

- Failure to file penalty — https://www.irs.gov/payments/failure-to-file-penalty
- IRM 20.1.2 — Failure To File/Failure To Pay Penalties — https://www.irs.gov/irm/part20/irm_20-001-002r
- 26 U.S.C. § 6651 — https://www.law.cornell.edu/uscode/text/26/6651

## Failure-to-pay penalty

- Failure to pay penalty — https://www.irs.gov/payments/failure-to-pay-penalty
- IRM 20.1.2 — https://www.irs.gov/irm/part20/irm_20-001-002r
- 26 U.S.C. § 6651 — https://www.law.cornell.edu/uscode/text/26/6651

## Interest

- Interest — https://www.irs.gov/payments/interest
- Quarterly interest rates — https://www.irs.gov/payments/quarterly-interest-rates
- IRM 20.2.5 — Interest on Underpayments — https://www.irs.gov/irm/part20/irm_20-002-005r
- 26 U.S.C. § 6601 — https://www.law.cornell.edu/uscode/text/26/6601
- 26 U.S.C. § 6621 — https://www.law.cornell.edu/uscode/text/26/6621
- 26 U.S.C. § 6622 — https://www.law.cornell.edu/uscode/text/26/6622
- 26 CFR § 301.6622-1 — https://www.ecfr.gov/current/title-26/section-301.6622-1

## Data-file verification record

| Data file | Coverage | Verified against | Verification date |
|---|---|---|---|
| `src/data/quarterlyInterestRates.ts` | Q1 2017 – Q3 2026 | Direct fetch of irs.gov/payments/quarterly-interest-rates | 2026-07-21 |
| `src/data/minimumFailureToFilePenalties.ts` | 2009 – present | irs.gov/payments/failure-to-file-penalty | 2026-07-21 |

A third-party historical rate table (smbiz.com) was consulted only as an informal cross-check
during development — it matched the IRS.gov data exactly on every overlapping quarter — but is not
cited anywhere in shipped data or documentation, per the requirement that production sources be
exclusively official government authority.
