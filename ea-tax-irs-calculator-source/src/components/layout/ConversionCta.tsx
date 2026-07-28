import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export function ConversionCta() {
  return (
    <section className="rounded-card border border-ea-border bg-ea-evergreen px-6 py-10 text-white sm:px-10 sm:py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
        <h2 className="text-2xl font-semibold sm:text-3xl">Get Help Reviewing Your IRS Tax Problem</h2>
        <p className="text-sm leading-relaxed text-white/85 sm:text-base">
          An online calculator can provide an estimate, but IRS transcripts and account history are often
          needed to determine the actual balance and whether penalty relief or another resolution option
          may apply.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton
            href="https://calendly.com/ea-tax-resolutions/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
          >
            Schedule a Free Discovery Call
            <ArrowUpRight size={16} aria-hidden="true" />
          </LinkButton>
          <LinkButton
            href="https://www.eataxresolutions.com/irs-penalty-abatement"
            variant="secondary"
            className="border-white text-white hover:bg-white/10"
          >
            Learn About IRS Penalty Abatement
          </LinkButton>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          EA Tax Resolutions is led by Anthony Fontana, CPA, a former California Franchise Tax Board
          auditor. EA Tax Resolutions helps taxpayers review IRS and California tax problems using a
          direct, practical, and fact-based approach.
        </p>
        <Link href="/methodology" className="text-xs font-medium text-white/80 underline">
          Read our calculation methodology
        </Link>
      </div>
    </section>
  );
}
