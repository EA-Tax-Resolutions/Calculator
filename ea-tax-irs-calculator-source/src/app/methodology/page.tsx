import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OFFICIAL_SOURCES } from "@/data/officialSources";
import { QUARTERLY_INTEREST_RATES, VERIFIED_DATE } from "@/data/quarterlyInterestRates";
import { MINIMUM_FAILURE_TO_FILE_PENALTIES } from "@/data/minimumFailureToFilePenalties";

export const metadata: Metadata = {
  title: "Calculation Methodology | EA Tax Resolutions",
  description: "How the IRS Penalty and Interest Calculator computes failure-to-file, failure-to-pay, and interest estimates.",
  alternates: { canonical: "/methodology" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-ea-evergreen">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-ea-black">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  const lastRateRow = QUARTERLY_INTEREST_RATES[QUARTERLY_INTEREST_RATES.length - 1];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-ea-green">Documentation</p>
        <h1 className="mt-2 text-3xl font-bold text-ea-evergreen">Calculation Methodology</h1>
        <p className="mt-3 text-sm text-ea-muted">
          Reviewed by Anthony Fontana, CPA — former California Franchise Tax Board auditor. Last reviewed:
          July 21, 2026.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          <Section title="Scope">
            <p>
              This calculator applies only to federal individual income tax (Form 1040), tax shown on the
              return, the failure-to-file penalty (IRC § 6651(a)(1)), the failure-to-pay penalty (IRC §
              6651(a)(2)), and interest on unpaid tax and, where applicable, on these penalties. It does not
              cover California FTB liabilities, estimated-tax penalties, accuracy-related or fraud
              penalties, payroll-tax penalties, corporate tax, audit deficiencies, bankruptcy periods,
              disaster or combat-zone postponements, or collection-statute calculations.
            </p>
          </Section>

          <Section title="Failure-to-file penalty">
            <p>
              5% of the unpaid tax (tax required to be shown, reduced by timely payments made on or before
              the original payment due date — not by payments made afterward) for each month or part of a
              month the return is late, measured from the applicable filing due date (including a valid
              extension), capped at 5 months (25%).
            </p>
            <p>
              <strong>Minimum penalty:</strong> if the return is filed more than 60 days after the
              applicable filing due date (including a valid extension), the penalty is not less than the
              lesser of (a) a statutory dollar amount, selected by the year of the <em>original</em>{" "}
              (unextended) due date, or (b) 100% of the unpaid tax. The statutory dollar amount is never
              compared against the full tax shown on the return — only against the actual underpayment.
            </p>
            <p>
              <strong>Coordination with failure-to-pay:</strong> for any month in which both penalties run,
              the failure-to-file penalty for that month is reduced, dollar for dollar, by whatever
              failure-to-pay penalty was actually imposed for that same calendar month — whether that
              amount reflects the standard 0.5% rate, the reduced 0.25% installment-agreement rate, or the
              increased 1% levy-notice rate. This application does not hardcode a fixed combined rate (such
              as 4.5%) for the coordination reduction.
            </p>
          </Section>

          <Section title="Failure-to-pay penalty">
            <p>
              0.5% of the unpaid tax for each month or part of a month unpaid, measured from the day after
              the original payment due date, using the unpaid balance immediately before each month begins.
              A payment made during a month reduces the balance for later months but does not reduce that
              month&apos;s own charge. Capped at 25% of the underpayment; the month that would cross 25% is
              truncated to land at exactly 25%, not prorated by days.
            </p>
            <p>
              The rate is reduced to 0.25% only for a month in which the taxpayer is an individual, the
              return was filed timely (including a valid extension), and an approved installment agreement
              is in effect — an installment-agreement date alone, without timely filing, does not qualify.
              The rate increases to 1% starting with the first month whose <em>start date</em> falls on or
              after 10 calendar days following an IRS notice of intent to levy — not the month that merely
              contains that 10-day threshold.
            </p>
          </Section>

          <Section title="Interest">
            <p>
              Interest on unpaid tax begins the day after the original payment due date and compounds
              daily, using the published IRS quarterly rate in effect for each day (federal short-term rate
              plus 3 percentage points for individuals). Interest on the failure-to-file penalty begins on
              the applicable filing due date itself (including a valid extension), reflecting this
              application&apos;s reading of IRC § 6601(e)(2)(B) — confirm this interpretation before relying
              on results.
            </p>
            <p>
              Interest on the failure-to-pay penalty is included only when an IRS notice-and-demand date is
              entered, and only for the period after that date if the penalty was not paid in full within
              21 calendar days (10 business days if the amount stated in the notice is $100,000 or more) —
              per IRC § 6601(e). A notice-and-demand date alone does not automatically produce interest.
            </p>
            <p>
              The daily rate is the annual rate divided by 365, or 366 in a leap year (actual/actual). This
              is the convention this application implements; confirm it against 26 CFR § 301.6622-1 and IRM
              20.2.5 before relying on results. Interest stops accruing once the calculation-through date
              exceeds the last verified quarterly rate ({lastRateRow?.quarterEnd}); an optional, clearly
              labeled manual override rate can be supplied for any period beyond that date.
            </p>
          </Section>

          <Section title="Payments and the estimate ledger">
            <p>
              Each payment is applied, in order, to: remaining unpaid tax, then the failure-to-file penalty,
              then the failure-to-pay penalty, then interest on each of those in the same order. This is a
              stated assumption for estimation purposes — the IRS may apply payments differently based on
              transcript transactions, designated payments, assessments, credits, reversals, and account
              history. When a payment reduces a penalty&apos;s outstanding principal, interest on that
              penalty is reduced accordingly from the payment date forward.
            </p>
          </Section>

          <Section title="Rounding">
            <p>
              All arithmetic uses arbitrary-precision decimal math (not binary floating point). Intermediate
              values are never rounded; only the final displayed dollar amounts are rounded to the nearest
              cent.
            </p>
          </Section>

          <Section title="Data currency">
            <p>Interest-rate table verified through {VERIFIED_DATE}, covering {QUARTERLY_INTEREST_RATES[0]?.quarterStart} through {lastRateRow?.quarterEnd}.</p>
            <p>Minimum failure-to-file penalty table current through the bracket effective {MINIMUM_FAILURE_TO_FILE_PENALTIES[MINIMUM_FAILURE_TO_FILE_PENALTIES.length - 1]?.effectiveStart} onward.</p>
            <p>Calculator logic last updated: July 21, 2026.</p>
          </Section>

          <Section title="Official sources">
            <ul className="flex flex-col gap-1.5">
              {OFFICIAL_SOURCES.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ea-green hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <p className="mt-10 text-xs text-ea-muted">
          Return to the <Link href="/" className="text-ea-green hover:underline">calculator</Link>.
        </p>
      </main>
      <Footer />
    </>
  );
}
