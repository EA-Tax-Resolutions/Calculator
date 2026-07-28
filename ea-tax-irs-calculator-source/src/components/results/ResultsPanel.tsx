"use client";

import { Printer, Download, Copy, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { CalculationDetails } from "@/components/results/CalculationDetails";
import { formatMoney, formatDate } from "@/lib/formatting";
import type { EstimateResult } from "@/calculation/types";

interface Props {
  result: EstimateResult | null;
  onReset: () => void;
  onCopySummary: () => void;
  onDownloadCsv: () => void;
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className={muted ? "text-ea-muted" : "text-ea-black"}>{label}</span>
      <span className={`font-medium tabular-nums ${muted ? "text-ea-muted" : "text-ea-black"}`}>{value}</span>
    </div>
  );
}

export function ResultsPanel({ result, onReset, onCopySummary, onDownloadCsv }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Card>
        <CardHeader className="border-b border-ea-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-ea-muted">Estimated IRS Balance</p>
          <p
            key={result ? result.totals.grandTotal.toFixed(2) : "empty"}
            className="mt-1 text-4xl font-bold tabular-nums text-ea-evergreen motion-safe:animate-[fadeIn_400ms_ease-out] sm:text-5xl"
          >
            {result ? formatMoney(result.totals.grandTotal) : "$0.00"}
          </p>
          <p className="mt-1 text-xs text-ea-muted">
            {result ? `Calculated through ${formatDate(result.input.calculationThroughDate)}` : "Enter your information to see an estimate"}
          </p>
        </CardHeader>

        {result && (
          <CardBody className="flex flex-col gap-5 pt-5">
            <BalanceChart
              remainingTax={result.totals.remainingUnpaidTax}
              ftfPenalty={result.totals.failureToFilePenalty}
              ftpPenalty={result.totals.failureToPayPenalty}
              interest={result.totals.totalInterest}
            />

            <div className="divide-y divide-ea-border/60 border-t border-ea-border pt-1">
              <Row label="Original unpaid tax" value={formatMoney(result.originalUnpaidTax)} muted />
              <Row label="Remaining unpaid tax" value={formatMoney(result.totals.remainingUnpaidTax)} />
              <Row label="Failure-to-file penalty" value={formatMoney(result.totals.failureToFilePenalty)} />
              <Row label="Failure-to-pay penalty" value={formatMoney(result.totals.failureToPayPenalty)} />
              <Row label="Interest on unpaid tax" value={formatMoney(result.totals.taxInterest)} muted />
              <Row label="Interest on failure-to-file penalty" value={formatMoney(result.totals.ftfPenaltyInterest)} muted />
              {"omitted" in result.ftpPenaltyInterest ? (
                <Row label="Interest on failure-to-pay penalty" value="Not included" muted />
              ) : (
                <Row label="Interest on failure-to-pay penalty" value={formatMoney(result.totals.ftpPenaltyInterest)} muted />
              )}
              <Row label="Total estimated interest" value={formatMoney(result.totals.totalInterest)} />
              <Row label="Total estimated balance" value={formatMoney(result.totals.grandTotal)} />
            </div>

            <div className="no-print flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" />
                Print
              </Button>
              <Button type="button" variant="secondary" onClick={onDownloadCsv}>
                <Download size={16} aria-hidden="true" />
                Download CSV
              </Button>
              <Button type="button" variant="secondary" onClick={onCopySummary}>
                <Copy size={16} aria-hidden="true" />
                Copy summary
              </Button>
              <Button type="button" variant="ghost" onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset
              </Button>
            </div>
          </CardBody>
        )}
      </Card>

      {result && (
        <div aria-live="polite" className="sr-only">
          Estimated balance updated to {formatMoney(result.totals.grandTotal)}.
        </div>
      )}

      {result && <CalculationDetails result={result} />}

      <p className="text-xs leading-relaxed text-ea-muted">
        The IRS may apply payments differently based on transcript transactions, designated payments,
        assessments, credits, and account history.
      </p>
    </div>
  );
}
