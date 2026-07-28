import type { PlainDate } from "./dates";
import { isBefore, isSameOrBefore } from "./dates";
import { add, minMoney, money, subtractFloorZero, ZERO, isZero, type Money } from "./money";
import type { BalanceCurve, LedgerStep, PaymentInput, PaymentAllocation, PaymentCascadeEntry } from "./types";

export interface MergedPayment {
  date: PlainDate;
  amount: Money;
  sourceIds: string[];
}

/**
 * Sorts payments chronologically and sums same-date entries rather than
 * silently keeping only one (duplicate-date support is required — the UI
 * allows multiple payments on the same day).
 */
export function sortAndMergePayments(payments: PaymentInput[]): {
  merged: MergedPayment[];
  hadDuplicateDates: boolean;
} {
  const byDate = new Map<string, MergedPayment>();
  for (const p of payments) {
    const key = p.date.toString();
    const existing = byDate.get(key);
    if (existing) {
      existing.amount = add(existing.amount, p.amount);
      existing.sourceIds.push(p.id);
    } else {
      byDate.set(key, { date: p.date, amount: p.amount, sourceIds: [p.id] });
    }
  }
  const merged = [...byDate.values()].sort((a, b) => (isBefore(a.date, b.date) ? -1 : isBefore(b.date, a.date) ? 1 : 0));
  const hadDuplicateDates = merged.some((m) => m.sourceIds.length > 1);
  return { merged, hadDuplicateDates };
}

export function buildCurveFromSteps(initial: Money, steps: LedgerStep[]): BalanceCurve {
  return {
    initial,
    steps,
    balanceAsOf(date: PlainDate): Money {
      // "As of" is inclusive of same-date payments: a payment on `date`
      // has already reduced the balance for interest purposes starting
      // that day. Callers that need the failure-to-pay rule's "balance
      // IMMEDIATELY BEFORE the month begins" must pass dayBefore(blockStart).
      let result = initial;
      for (const step of steps) {
        if (isSameOrBefore(step.date, date)) {
          result = step.remainingAfter;
        } else {
          break;
        }
      }
      return result;
    },
  };
}

/**
 * Pass A: the tax-principal curve, needed before FTF/FTP amounts can even
 * be computed (failure-to-pay's month-by-month walk consumes this curve
 * directly). This is cascade-order-invariant — tax principal is always the
 * first bucket drained regardless of downstream penalty amounts — so it
 * can be built without knowing the final FTF/FTP totals.
 */
export function buildTaxPrincipalCurve(
  capBase: Money,
  payments: PaymentInput[],
): { curve: BalanceCurve; merged: MergedPayment[]; hadDuplicateDates: boolean } {
  const { merged, hadDuplicateDates } = sortAndMergePayments(payments);
  let remaining = capBase;
  const steps: LedgerStep[] = [];
  for (const p of merged) {
    const toTax = minMoney(p.amount, remaining);
    remaining = subtractFloorZero(remaining, toTax);
    steps.push({ date: p.date, remainingAfter: remaining });
  }
  return { curve: buildCurveFromSteps(capBase, steps), merged, hadDuplicateDates };
}

/**
 * Pass B: once FTF/FTP totals are known, cascades each payment through the
 * full bucket order — tax principal, then FTF penalty principal, then FTP
 * penalty principal — producing a real, reducible balance curve for each
 * penalty bucket so its own interest stream can compound on the correct,
 * possibly-declining principal. This is a disclosed, stated assumption
 * about allocation order (PAYMENT_ALLOCATION_ORDER_ASSUMED) — actual IRS
 * allocation depends on transcript-specific facts.
 *
 * Any excess remaining after all three principal buckets are exhausted is
 * returned per-payment as `unappliedToPrincipal`, for the caller to net
 * against computed interest totals for ledger DISPLAY only — it does not
 * feed back into the interest math (see calculateEstimate.ts).
 */
export function runPrincipalCascade(params: {
  capBase: Money;
  ftfTotal: Money;
  ftpTotal: Money;
  payments: PaymentInput[];
}): {
  taxCurve: BalanceCurve;
  ftfPenaltyCurve: BalanceCurve;
  ftpPenaltyCurve: BalanceCurve;
  perPayment: Array<{
    date: PlainDate;
    amount: Money;
    toTaxPrincipal: Money;
    toFtfPenalty: Money;
    toFtpPenalty: Money;
    unappliedToPrincipal: Money;
  }>;
  hadDuplicateDates: boolean;
} {
  const { merged, hadDuplicateDates } = sortAndMergePayments(params.payments);

  let remainingTax = params.capBase;
  let remainingFtf = params.ftfTotal;
  let remainingFtp = params.ftpTotal;

  const taxSteps: LedgerStep[] = [];
  const ftfSteps: LedgerStep[] = [];
  const ftpSteps: LedgerStep[] = [];
  const perPayment: Array<{
    date: PlainDate;
    amount: Money;
    toTaxPrincipal: Money;
    toFtfPenalty: Money;
    toFtpPenalty: Money;
    unappliedToPrincipal: Money;
  }> = [];

  for (const p of merged) {
    let cash = p.amount;

    const toTaxPrincipal = minMoney(cash, remainingTax);
    remainingTax = subtractFloorZero(remainingTax, toTaxPrincipal);
    cash = subtractFloorZero(cash, toTaxPrincipal);
    taxSteps.push({ date: p.date, remainingAfter: remainingTax });

    const toFtfPenalty = minMoney(cash, remainingFtf);
    remainingFtf = subtractFloorZero(remainingFtf, toFtfPenalty);
    cash = subtractFloorZero(cash, toFtfPenalty);
    ftfSteps.push({ date: p.date, remainingAfter: remainingFtf });

    const toFtpPenalty = minMoney(cash, remainingFtp);
    remainingFtp = subtractFloorZero(remainingFtp, toFtpPenalty);
    cash = subtractFloorZero(cash, toFtpPenalty);
    ftpSteps.push({ date: p.date, remainingAfter: remainingFtp });

    perPayment.push({
      date: p.date,
      amount: p.amount,
      toTaxPrincipal,
      toFtfPenalty,
      toFtpPenalty,
      unappliedToPrincipal: cash,
    });
  }

  return {
    taxCurve: buildCurveFromSteps(params.capBase, taxSteps),
    ftfPenaltyCurve: buildCurveFromSteps(params.ftfTotal, ftfSteps),
    ftpPenaltyCurve: buildCurveFromSteps(params.ftpTotal, ftpSteps),
    perPayment,
    hadDuplicateDates,
  };
}

/**
 * Final ledger allocation for display, run AFTER all three interest
 * streams are known. Any cash left over once tax + FTF penalty + FTP
 * penalty principal are exhausted cascades into the (already-computed)
 * interest totals, tax-interest first, then FTF-penalty interest, then
 * FTP-penalty interest — for the payment ledger table only. This does
 * NOT re-trigger interest recomputation; it is a display-only netting of
 * an already-final total against remaining cash from very large payments.
 */
export function allocateExcessToInterest(
  perPayment: ReturnType<typeof runPrincipalCascade>["perPayment"],
  totals: { taxInterest: Money; ftfPenaltyInterest: Money; ftpPenaltyInterest: Money },
): PaymentAllocation[] {
  let remainingTaxInterest = totals.taxInterest;
  let remainingFtfInterest = totals.ftfPenaltyInterest;
  let remainingFtpInterest = totals.ftpPenaltyInterest;

  return perPayment.map((p) => {
    let cash = p.unappliedToPrincipal;

    const toTaxInterest = minMoney(cash, remainingTaxInterest);
    remainingTaxInterest = subtractFloorZero(remainingTaxInterest, toTaxInterest);
    cash = subtractFloorZero(cash, toTaxInterest);

    const toFtfPenaltyInterest = minMoney(cash, remainingFtfInterest);
    remainingFtfInterest = subtractFloorZero(remainingFtfInterest, toFtfPenaltyInterest);
    cash = subtractFloorZero(cash, toFtfPenaltyInterest);

    const toFtpPenaltyInterest = minMoney(cash, remainingFtpInterest);
    remainingFtpInterest = subtractFloorZero(remainingFtpInterest, toFtpPenaltyInterest);
    cash = subtractFloorZero(cash, toFtpPenaltyInterest);

    const allocation: PaymentCascadeEntry = {
      toTaxPrincipal: p.toTaxPrincipal,
      toFtfPenalty: p.toFtfPenalty,
      toFtpPenalty: p.toFtpPenalty,
      toTaxInterest,
      toFtfPenaltyInterest,
      toFtpPenaltyInterest,
      unapplied: cash,
    };

    return {
      payment: { id: "", date: p.date, amount: p.amount },
      allocation,
    };
  });
}

export function balanceIsZero(curve: BalanceCurve, date: PlainDate): boolean {
  return isZero(curve.balanceAsOf(date));
}

export { ZERO as ZERO_MONEY, money };
