import { describe, it, expect } from "vitest";
import { calculateEstimate } from "@/calculation/calculateEstimate";
import { baseInput, usd, d } from "./helpers";

/**
 * Corrected minimum-penalty rule: the comparison base is 100% of the
 * UNPAID tax (the underpayment), not the full "tax required to be shown."
 * This scenario deliberately makes those two figures differ ($5,000 shown,
 * $4,700 timely-withheld -> $300 unpaid) so a base-selection bug would be
 * caught: using $5,000 against the 2024 table figure ($485) would wrongly
 * yield $485; using the correct $300 underpayment yields $300.
 */
describe("Gate 2: minimum failure-to-file penalty (100% of underpayment, not tax shown)", () => {
  it("caps the minimum penalty at the underpayment amount when it is smaller than the statutory table figure", () => {
    const input = baseInput({
      dueDates: {
        originalPaymentDueDate: d("2024-04-15"),
        filingDueDate: d("2024-04-15"),
      },
      taxRequiredToBeShown: usd(5000),
      withholding: usd(4700),
      returnFiled: true,
      actualFiledDate: d("2024-08-01"), // 108 days late, well past the 60-day threshold
      calculationThroughDate: d("2024-08-01"),
      wasFiledTimely: false,
    });

    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.originalUnpaidTax.toFixed(2)).toBe("300.00");
    expect(result.value.ftf.minimumPenaltyApplied).toBe(true);
    // The statutory table amount for a 2024 original due date is $485, but
    // the minimum penalty must not exceed 100% of the $300 underpayment.
    expect(result.value.ftf.minimumPenaltyAmount?.toFixed(2)).toBe("300.00");
    expect(result.value.ftf.finalAmount.toFixed(2)).toBe("300.00");
  });

  it("uses the statutory table amount when it is smaller than the underpayment but still exceeds the computed net penalty", () => {
    // ftfBase = $1,000 (> the $485 table figure, so the table amount is the
    // lesser of the two) while the actual coordinated net penalty for 4
    // months (~4.5%/month after FTP overlap) is only $180 - well under $485,
    // so the statutory minimum still governs the final amount.
    const input = baseInput({
      dueDates: {
        originalPaymentDueDate: d("2024-04-15"),
        filingDueDate: d("2024-04-15"),
      },
      taxRequiredToBeShown: usd(1000),
      returnFiled: true,
      actualFiledDate: d("2024-08-01"),
      calculationThroughDate: d("2024-08-01"),
      wasFiledTimely: false,
    });

    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.ftf.netTotal.toFixed(2)).toBe("180.00");
    expect(result.value.ftf.minimumPenaltyApplied).toBe(true);
    expect(result.value.ftf.minimumPenaltyAmount?.toFixed(2)).toBe("485.00");
    expect(result.value.ftf.finalAmount.toFixed(2)).toBe("485.00");
  });
});
