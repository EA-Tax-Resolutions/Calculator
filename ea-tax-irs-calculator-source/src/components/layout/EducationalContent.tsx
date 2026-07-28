import Link from "next/link";

const faqs = [
  {
    q: "How are IRS late-filing penalties calculated?",
    a: "The failure-to-file penalty is generally 5% of the unpaid tax for each month or part of a month a return is late, up to a maximum of 25%. A minimum penalty applies if the return is filed more than 60 days late.",
  },
  {
    q: "How are IRS late-payment penalties calculated?",
    a: "The failure-to-pay penalty is generally 0.5% of the unpaid tax for each month or part of a month the tax remains unpaid, up to a maximum of 25%. The rate can be reduced to 0.25% during an approved installment agreement (if the return was filed timely) or increased to 1% after a levy notice.",
  },
  {
    q: "How does IRS interest compound?",
    a: "Interest on unpaid federal tax compounds daily at a rate set quarterly by the IRS, generally the federal short-term rate plus 3 percentage points for individuals.",
  },
  {
    q: "Does a filing extension stop interest?",
    a: "No. A filing extension generally extends the time to file a return, not the time to pay the tax. Interest and the failure-to-pay penalty both generally begin the day after the original payment due date.",
  },
  {
    q: "Can IRS penalties be removed?",
    a: "Some penalties may be reduced or removed through options such as First Time Abatement or reasonable cause relief, depending on the facts and account history. This calculator's illustrative scenario does not determine eligibility — the IRS makes the final decision.",
  },
  {
    q: "Why might the IRS balance differ from this estimate?",
    a: "Actual balances can differ due to assessment dates, how payments were applied, penalty relief already granted, account adjustments, disaster or combat-zone relief, bankruptcy, and other transcript-specific facts this calculator does not model.",
  },
  {
    q: "What records are needed to verify the balance?",
    a: "A current IRS account transcript or an official payoff amount from the IRS is the most reliable way to confirm what is actually owed.",
  },
  {
    q: "What does this calculator exclude?",
    a: "It does not include estimated-tax penalties, Form 2210, accuracy-related or fraud penalties, payroll-tax penalties, corporate tax, audit deficiencies, bankruptcy periods, disaster postponements, or California FTB liabilities.",
  },
];

export function EducationalContent() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-ea-evergreen">Frequently asked questions</h2>
        <div className="flex flex-col gap-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-base font-semibold text-ea-black">{f.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ea-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-ea-border bg-white p-5 text-sm text-ea-muted">
        <p>
          Reviewed by <span className="font-semibold text-ea-black">Anthony Fontana, CPA</span> — Enrolled
          Agent, former California Franchise Tax Board auditor.
        </p>
        <p className="mt-1">Last reviewed: July 21, 2026.</p>
        <p className="mt-3">
          See{" "}
          <Link href="/methodology" className="font-medium text-ea-green hover:underline">
            CALCULATION-METHODOLOGY
          </Link>{" "}
          for full sources and the &quot;last updated&quot; dates of the calculator logic, interest-rate
          data, and minimum-penalty data.
        </p>
      </div>
    </section>
  );
}
