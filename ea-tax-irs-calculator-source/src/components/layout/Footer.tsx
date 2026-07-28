import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ea-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="max-w-3xl text-xs leading-relaxed text-ea-muted">
          This calculator provides a general estimate for educational purposes. It is not an IRS tool,
          legal advice, or tax advice. It does not review IRS transcripts, determine penalty-relief
          eligibility, account for every tax rule, or guarantee that the IRS will calculate the same
          amount. Interest rates, assessment dates, payment application, notices, account adjustments,
          disaster relief, bankruptcy, and other facts may change the result. The IRS makes the final
          determination.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-ea-muted">
          Do not rely on this estimate to determine the amount required to fully pay an IRS account.
          Obtain a current IRS payoff balance or account transcript before making decisions.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/methodology" className="font-medium text-ea-evergreen hover:underline">
            Methodology
          </Link>
          <Link href="/privacy" className="font-medium text-ea-evergreen hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="font-medium text-ea-evergreen hover:underline">
            Terms
          </Link>
          <Link href="https://www.eataxresolutions.com/" className="font-medium text-ea-evergreen hover:underline">
            EA Tax Resolutions
          </Link>
        </div>
        <p className="mt-6 text-xs text-ea-muted">
          © {new Date().getFullYear()} EA Tax Resolutions. Anthony Fontana, CPA — Enrolled Agent, former
          California Franchise Tax Board auditor.
        </p>
      </div>
    </footer>
  );
}
