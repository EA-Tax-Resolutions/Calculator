import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConversionCta } from "@/components/layout/ConversionCta";
import { EducationalContent } from "@/components/layout/EducationalContent";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "IRS Penalty and Interest Calculator",
    url: "https://calculator.eataxresolutions.com",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Estimate certain IRS late-filing penalties, late-payment penalties, and interest using published IRS rules and quarterly rates.",
  },
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "EA Tax Resolutions",
    url: "https://www.eataxresolutions.com/",
    image: "https://calculator.eataxresolutions.com/brand/ea-tax-resolutions-logo.png",
    description:
      "EA Tax Resolutions helps taxpayers resolve IRS and California tax problems, led by Anthony Fontana, CPA, a former California Franchise Tax Board auditor.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Anthony Fontana",
    jobTitle: "CPA, Enrolled Agent",
    worksFor: { "@type": "Organization", name: "EA Tax Resolutions" },
    description: "Former California Franchise Tax Board auditor.",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "EA Tax Resolutions", item: "https://www.eataxresolutions.com/" },
      { "@type": "ListItem", position: 2, name: "IRS Penalty and Interest Calculator", item: "https://calculator.eataxresolutions.com" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How are IRS late-filing penalties calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The failure-to-file penalty is generally 5% of the unpaid tax for each month or part of a month a return is late, up to a maximum of 25%. A minimum penalty applies if the return is filed more than 60 days late.",
        },
      },
      {
        "@type": "Question",
        name: "How are IRS late-payment penalties calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The failure-to-pay penalty is generally 0.5% of the unpaid tax for each month or part of a month the tax remains unpaid, up to a maximum of 25%, with reduced or increased rates in certain circumstances.",
        },
      },
      {
        "@type": "Question",
        name: "Does a filing extension stop interest?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. A filing extension generally extends the time to file a return, not the time to pay the tax.",
        },
      },
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main>
        <section className="border-b border-ea-border bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-ea-green">
              EA Tax Resolutions Calculator
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold text-ea-evergreen sm:text-4xl lg:text-5xl">
              Estimate IRS Penalties and Interest
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ea-black sm:text-lg">
              This calculator estimates certain IRS failure-to-file penalties, failure-to-pay penalties,
              and interest for an individual federal income tax balance. The actual IRS balance may differ
              based on assessment dates, account transactions, payment application, penalty relief, and
              other facts.
            </p>
            <p className="mt-3 max-w-2xl text-sm font-medium text-ea-muted">
              Built for educational estimates using published IRS rules and quarterly interest rates.
            </p>
            <p className="mt-1 max-w-2xl text-sm font-medium text-ea-muted">
              EA Tax Resolutions is led by Anthony Fontana, CPA, a former California Franchise Tax Board
              auditor.
            </p>
            <div className="mt-5 max-w-2xl rounded-card border border-ea-border bg-ea-bg p-4 text-sm text-ea-muted">
              Your entries remain in your browser. Do not enter a Social Security number, IRS account
              number, address, or other sensitive information.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <CalculatorForm />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <ConversionCta />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <EducationalContent />
        </section>
      </main>
      <Footer />
    </>
  );
}
