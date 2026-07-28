import { Accordion } from "@/components/ui/Accordion";
import { formatMoney, formatDateShort, formatPercent } from "@/lib/formatting";
import { OFFICIAL_SOURCES } from "@/data/officialSources";
import type { EstimateResult } from "@/calculation/types";

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-xs">
        <caption className="sr-only">Calculation detail table</caption>
        <thead>
          <tr className="border-b border-ea-border text-ea-muted">
            {headers.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-ea-border/60 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap py-2 pr-4 text-ea-black">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CalculationDetails({ result }: { result: EstimateResult }) {
  const ftpRows = result.ftp.monthlyBreakdown.map((m) => [
    `Month ${m.index}`,
    `${formatDateShort(m.start)} – ${formatDateShort(m.end)}`,
    formatMoney(m.balanceAtStart),
    formatPercent(m.rate),
    m.rateReason.replace(/_/g, " "),
    formatMoney(m.amount),
  ]);

  const ftfRows = result.ftf.monthlyBreakdown.map((m) => [
    `Month ${m.index}`,
    `${formatDateShort(m.start)} – ${formatDateShort(m.end)}`,
    formatMoney(m.grossAmount),
    formatMoney(m.ftpOverlapReduction),
    formatMoney(m.netAmount),
  ]);

  const rateRows = [
    ...result.taxInterest.segments,
    ...result.ftfPenaltyInterest.segments,
    ...("segments" in result.ftpPenaltyInterest ? result.ftpPenaltyInterest.segments : []),
  ]
    .sort((a, b) => (a.start.toString() < b.start.toString() ? -1 : 1))
    .map((s) => [
      s.quarterLabel,
      `${formatDateShort(s.start)} – ${formatDateShort(s.end)}`,
      formatPercent(s.annualRate),
      s.verified ? "Verified (IRS.gov)" : "Manual override",
      formatMoney(s.interestForSegment),
    ]);

  const ledgerRows = result.ledger.map((entry) => [
    formatDateShort(entry.payment.date),
    formatMoney(entry.payment.amount),
    formatMoney(entry.allocation.toTaxPrincipal),
    formatMoney(entry.allocation.toFtfPenalty),
    formatMoney(entry.allocation.toFtpPenalty),
    formatMoney(
      entry.allocation.toTaxInterest.plus(entry.allocation.toFtfPenaltyInterest).plus(entry.allocation.toFtpPenaltyInterest),
    ),
  ]);

  return (
    <div className="flex flex-col gap-3">
      <Accordion title="Failure-to-pay penalty by month">
        <Table
          headers={["Month", "Period", "Balance at start", "Rate", "Reason", "Amount"]}
          rows={ftpRows.length ? ftpRows : [["—", "No failure-to-pay penalty applies", "", "", "", ""]]}
        />
      </Accordion>

      <Accordion title="Failure-to-file penalty by month">
        <Table
          headers={["Month", "Period", "Gross amount", "Overlap reduction", "Net amount"]}
          rows={ftfRows.length ? ftfRows : [["—", "No failure-to-file penalty applies", "", "", ""]]}
        />
        {result.ftf.minimumPenaltyApplied && (
          <p className="mt-3 text-xs text-ea-muted">
            The statutory minimum penalty applied because the return was filed more than 60 days after the
            applicable filing due date.
          </p>
        )}
      </Accordion>

      <Accordion title="Quarterly interest rates used">
        <Table
          headers={["Quarter", "Period", "Annual rate", "Source", "Interest"]}
          rows={rateRows.length ? rateRows : [["—", "No interest accrued", "", "", ""]]}
        />
      </Accordion>

      <Accordion title="Payment ledger">
        <Table
          headers={["Date", "Amount", "To tax", "To FTF penalty", "To FTP penalty", "To interest"]}
          rows={ledgerRows.length ? ledgerRows : [["—", "No payments entered", "", "", "", ""]]}
        />
      </Accordion>

      <Accordion title="Warnings and assumptions">
        <ul className="flex flex-col gap-3 text-xs text-ea-black">
          {result.warnings.map((w, i) => (
            <li key={i} className="flex gap-2">
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  w.severity === "review" ? "bg-ea-coral" : w.severity === "caution" ? "bg-ea-amber" : "bg-ea-green"
                }`}
                aria-hidden="true"
              />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Exclusions">
        <p className="text-xs leading-relaxed text-ea-muted">
          This calculator applies only to federal individual income tax (Form 1040) tax shown on the
          return, the failure-to-file penalty (IRC § 6651(a)(1)), the failure-to-pay penalty (IRC §
          6651(a)(2)), and related interest. It does NOT include: estimated-tax penalties (IRC § 6654) or
          Form 2210, accuracy-related penalties, fraud penalties, payroll-tax or failure-to-deposit
          penalties, Trust Fund Recovery Penalties, partnership or S corporation penalties, corporate
          income tax, substitute-for-return cases, audit deficiencies, bankruptcy periods, interest
          suspensions, disaster or combat-zone postponements, restricted-interest cases, or
          collection-statute calculations. It does not apply to California FTB liabilities.
        </p>
      </Accordion>

      <Accordion title="Official sources">
        <ul className="flex flex-col gap-1.5 text-xs">
          {OFFICIAL_SOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ea-green hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ea-muted">Rate table version: {result.rateTableVersion}</p>
      </Accordion>
    </div>
  );
}
