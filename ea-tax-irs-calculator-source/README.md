# IRS Penalty and Interest Calculator

A standalone web application by **EA Tax Resolutions** (Anthony Fontana, CPA — Enrolled Agent, former
California Franchise Tax Board auditor) that estimates certain IRS failure-to-file penalties,
failure-to-pay penalties, and interest on an individual (Form 1040) federal tax balance.

Every calculation runs entirely in the browser. There is no database, no user accounts, no API keys,
and no server-side storage of any entered information — see [PRIVACY.md](PRIVACY.md).

**This is an estimating tool for educational purposes, not an IRS system.** It always produces an
*estimated* balance, never claims to be exact, and includes extensive in-app disclaimers to that
effect. See [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for what it does and does not model.

## Documentation

| Document | Purpose |
|---|---|
| [BRAND-AUDIT.md](BRAND-AUDIT.md) | How the EA Tax Resolutions visual identity was extracted and applied |
| [CALCULATION-METHODOLOGY.md](CALCULATION-METHODOLOGY.md) | Exactly how every penalty/interest figure is computed |
| [OFFICIAL-SOURCES.md](OFFICIAL-SOURCES.md) | The government sources backing every rule and data table |
| [SOURCE-UPDATE-CHECKLIST.md](SOURCE-UPDATE-CHECKLIST.md) | How to keep interest-rate and penalty data current |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Local dev, testing, and Vercel/Netlify deployment |
| [PRIVACY.md](PRIVACY.md) | The privacy posture of this codebase |
| [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) | Documented scope boundaries and modeling simplifications |
| [CPA-REVIEW-CHECKLIST.md](CPA-REVIEW-CHECKLIST.md) | What Anthony Fontana, CPA, should verify before launch |

## Tech stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · `decimal.js` (all financial math)
· `@js-temporal/polyfill` (all tax-calendar dates) · React Hook Form · Zod · Vitest · React Testing
Library · Playwright · ESLint · Prettier.

Deliberately avoided: native JS `Date` for any tax-date math, and native floating-point arithmetic for
any dollar amount or rate.

## Project structure

```
src/
  app/                 Pages: home, /methodology, /privacy, /terms
  components/
    brand/             Logo
    calculator/        Input form sections (React Hook Form + Zod)
    results/           Results panel, calculation-details accordion, illustrative relief
    charts/            Accessible segmented balance chart
    layout/            Header, footer, conversion CTA, educational content
    ui/                 Button, Card, form fields, Accordion primitives
  calculation/         Pure calculation engine — no React/UI imports, fully unit-tested
  data/                Versioned IRS quarterly interest rates, minimum-penalty table, source list
  lib/                 Formatting, Zod validation/bridge, CSV/summary export, analytics stub
tests/
  unit/                Calculation-engine unit tests, including the 6 Stage-1 gate tests
  integration/         Full calculateEstimate() pipeline test
  e2e/                 Playwright browser tests
```

The calculation engine (`src/calculation/*`) is intentionally decoupled from the UI: every function
is pure, strongly typed, and independently testable.

## Getting started

```bash
npm install
npm run dev
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full command reference, testing, and production
deployment steps.

## Scope (Version 1)

Federal individual income tax (Form 1040) only: tax shown on the return, the failure-to-file penalty
(IRC § 6651(a)(1)), the failure-to-pay penalty (IRC § 6651(a)(2)), and interest (IRC §§ 6601, 6621,
6622). No California FTB module, no estimated-tax penalty, no accuracy/fraud penalties, no corporate
tax — see [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for the complete exclusion list. The
architecture is deliberately structured so a separate California module could be added later without
reusing IRS rules for California penalties, but that is not implemented here.

## License / usage

This is a private application for EA Tax Resolutions. Not licensed for redistribution.
