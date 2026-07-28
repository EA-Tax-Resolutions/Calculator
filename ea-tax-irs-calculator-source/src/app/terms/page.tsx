import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms | EA Tax Resolutions",
  description: "Terms of use for the IRS Penalty and Interest Calculator.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-ea-evergreen">Terms of use</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ea-black">
          <p>
            This calculator provides a general estimate for educational purposes. It is not an IRS tool,
            legal advice, or tax advice. It does not review IRS transcripts, determine penalty-relief
            eligibility, account for every tax rule, or guarantee that the IRS will calculate the same
            amount. Interest rates, assessment dates, payment application, notices, account adjustments,
            disaster relief, bankruptcy, and other facts may change the result. The IRS makes the final
            determination.
          </p>
          <p>
            Do not rely on this estimate to determine the amount required to fully pay an IRS account.
            Obtain a current IRS payoff balance or account transcript before making decisions.
          </p>
          <p>
            EA Tax Resolutions provides this tool without warranty of any kind, express or implied, and is
            not liable for any decisions made based on its output. Use of this calculator does not create an
            engagement, representation, or attorney/CPA-client relationship with EA Tax Resolutions or
            Anthony Fontana, CPA.
          </p>
          <p>
            This tool does not constitute a guarantee of any outcome, settlement, or penalty reduction. For
            advice specific to your situation, schedule a consultation with a qualified tax professional.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
