"use client";

import { formatUSD } from "@/calculation/money";
import type { Money } from "@/calculation/money";

interface Segment {
  label: string;
  amount: Money;
  colorVar: string;
}

interface Props {
  remainingTax: Money;
  ftfPenalty: Money;
  ftpPenalty: Money;
  interest: Money;
}

/**
 * An accessible segmented horizontal bar (not a bare color-only chart):
 * every segment has a visible text label and value, so no information is
 * conveyed by color alone. Built as a plain SVG/HTML bar rather than a
 * third-party donut so the labels stay screen-reader- and print-friendly.
 */
export function BalanceChart({ remainingTax, ftfPenalty, ftpPenalty, interest }: Props) {
  const segments: Segment[] = [
    { label: "Remaining unpaid tax", amount: remainingTax, colorVar: "var(--color-ea-green)" },
    { label: "Failure-to-file penalty", amount: ftfPenalty, colorVar: "var(--color-ea-amber)" },
    { label: "Failure-to-pay penalty", amount: ftpPenalty, colorVar: "var(--color-ea-orange)" },
    { label: "Interest", amount: interest, colorVar: "var(--color-ea-coral)" },
  ];
  const total = segments.reduce((sum, s) => sum + s.amount.toNumber(), 0);
  const nonZero = segments.filter((s) => s.amount.toNumber() > 0);

  return (
    <div>
      <div
        role="img"
        aria-label={`Balance breakdown: ${nonZero
          .map((s) => `${s.label} ${formatUSD(s.amount)}`)
          .join(", ")}`}
        className="flex h-4 w-full overflow-hidden rounded-full bg-ea-border motion-safe:[&>span]:transition-[width] motion-safe:[&>span]:duration-500"
      >
        {nonZero.map((s) => (
          <span
            key={s.label}
            style={{ width: `${total > 0 ? (s.amount.toNumber() / total) * 100 : 0}%`, backgroundColor: s.colorVar }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.colorVar }}
            />
            <span className="text-ea-muted">{s.label}:</span>
            <span className="font-medium text-ea-black">{formatUSD(s.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
