import { formatMoney, formatDate } from "@/lib/formatting";
import type { EstimateResult } from "@/calculation/types";

export function buildTextSummary(result: EstimateResult): string {
  const lines = [
    "IRS Penalty and Interest Calculator — EA Tax Resolutions",
    `Calculated through ${formatDate(result.input.calculationThroughDate)}`,
    "",
    `Original unpaid tax: ${formatMoney(result.originalUnpaidTax)}`,
    `Remaining unpaid tax: ${formatMoney(result.totals.remainingUnpaidTax)}`,
    `Failure-to-file penalty: ${formatMoney(result.totals.failureToFilePenalty)}`,
    `Failure-to-pay penalty: ${formatMoney(result.totals.failureToPayPenalty)}`,
    `Interest on unpaid tax: ${formatMoney(result.totals.taxInterest)}`,
    `Interest on failure-to-file penalty: ${formatMoney(result.totals.ftfPenaltyInterest)}`,
    `Interest on failure-to-pay penalty: ${
      "omitted" in result.ftpPenaltyInterest ? "Not included" : formatMoney(result.totals.ftpPenaltyInterest)
    }`,
    `Total estimated interest: ${formatMoney(result.totals.totalInterest)}`,
    `Total estimated balance: ${formatMoney(result.totals.grandTotal)}`,
    "",
    "This is a general estimate for educational purposes, not an IRS tool, legal advice, or tax advice.",
    "Source: calculator.eataxresolutions.com",
  ];
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(result: EstimateResult): string {
  const rows: string[][] = [
    ["Line item", "Amount"],
    ["Original unpaid tax", result.originalUnpaidTax.toFixed(2)],
    ["Remaining unpaid tax", result.totals.remainingUnpaidTax.toFixed(2)],
    ["Failure-to-file penalty", result.totals.failureToFilePenalty.toFixed(2)],
    ["Failure-to-pay penalty", result.totals.failureToPayPenalty.toFixed(2)],
    ["Interest on unpaid tax", result.totals.taxInterest.toFixed(2)],
    ["Interest on failure-to-file penalty", result.totals.ftfPenaltyInterest.toFixed(2)],
    [
      "Interest on failure-to-pay penalty",
      "omitted" in result.ftpPenaltyInterest ? "Not included" : result.totals.ftpPenaltyInterest.toFixed(2),
    ],
    ["Total estimated interest", result.totals.totalInterest.toFixed(2)],
    ["Total estimated balance", result.totals.grandTotal.toFixed(2)],
    [],
    ["Payment ledger"],
    ["Date", "Amount", "To tax", "To FTF penalty", "To FTP penalty", "To interest"],
    ...result.ledger.map((e) => [
      e.payment.date.toString(),
      e.payment.amount.toFixed(2),
      e.allocation.toTaxPrincipal.toFixed(2),
      e.allocation.toFtfPenalty.toFixed(2),
      e.allocation.toFtpPenalty.toFixed(2),
      e.allocation.toTaxInterest.plus(e.allocation.toFtfPenaltyInterest).plus(e.allocation.toFtpPenaltyInterest).toFixed(2),
    ]),
  ];
  return rows.map((r) => r.map((c) => csvEscape(String(c ?? ""))).join(",")).join("\n");
}

export function downloadCsv(result: EstimateResult): void {
  const csv = buildCsv(result);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "irs-penalty-interest-estimate.csv";
  link.click();
  URL.revokeObjectURL(url);
}
