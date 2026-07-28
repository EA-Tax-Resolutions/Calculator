import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { formatMoney } from "@/lib/formatting";
import type { EstimateResult } from "@/calculation/types";

export function IllustrativeRelief({ current, illustrative }: { current: EstimateResult; illustrative: EstimateResult }) {
  const difference = current.totals.grandTotal.minus(illustrative.totals.grandTotal);

  return (
    <Card className="border-ea-green/30 bg-ea-green/5">
      <CardBody className="flex flex-col gap-3 pt-5">
        <h3 className="text-base font-semibold text-ea-evergreen">
          Illustrative Balance if Selected Penalties Were Removed
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ea-muted">Current estimated balance</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(current.totals.grandTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-ea-muted">Illustrative revised estimate</p>
            <p className="text-lg font-semibold tabular-nums text-ea-green">{formatMoney(illustrative.totals.grandTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-ea-muted">Difference</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(difference)}</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ea-muted">
          This is an illustration only. It does not determine whether First Time Abatement, reasonable
          cause relief, statutory relief, or another form of penalty relief applies. The IRS makes the
          final decision.
        </p>
        <Link
          href="https://www.eataxresolutions.com/irs-penalty-abatement"
          className="text-sm font-semibold text-ea-green hover:underline"
        >
          Learn About IRS Penalty Abatement
        </Link>
      </CardBody>
    </Card>
  );
}
