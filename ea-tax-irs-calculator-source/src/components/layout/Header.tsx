import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";

const CALENDLY_URL = "https://calendly.com/ea-tax-resolutions/discovery-call";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-ea-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden sm:block h-8 w-px bg-ea-border" aria-hidden="true" />
          <span className="hidden text-sm font-semibold text-ea-evergreen sm:inline">
            IRS Penalty and Interest Calculator
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://www.eataxresolutions.com/"
            className="hidden text-sm font-medium text-ea-muted hover:text-ea-evergreen sm:inline"
          >
            Visit EA Tax Resolutions
          </Link>
          <LinkButton
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="text-xs sm:text-sm"
          >
            Schedule a Free Discovery Call
            <ArrowUpRight size={16} aria-hidden="true" />
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
