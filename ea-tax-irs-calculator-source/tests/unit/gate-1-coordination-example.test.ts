import { describe, it, expect } from "vitest";
import { calculateEstimate } from "@/calculation/calculateEstimate";
import { baseInput, usd, d } from "./helpers";

/**
 * Required IRM coordination example (spec section 21):
 * Tax shown $5,000, due Apr 15 2022, no extension, payments $2,000 (Jun 1)
 * and $3,000 (Jul 13), filed Jul 13 2022, standard FTP rate, no IA, no
 * levy notice. Expected: FTP = $65, FTF = $685.
 */
describe("Gate 1: IRS $5,000 coordination example", () => {
  it("produces FTP $65 and FTF $685 exactly", () => {
    const input = baseInput({
      taxRequiredToBeShown: usd(5000),
      returnFiled: true,
      actualFiledDate: d("2022-07-13"),
      calculationThroughDate: d("2022-07-13"),
      wasFiledTimely: false,
      payments: [
        { id: "p1", date: d("2022-06-01"), amount: usd(2000) },
        { id: "p2", date: d("2022-07-13"), amount: usd(3000) },
      ],
    });

    const result = calculateEstimate(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.ftp.totalAmount.toFixed(2)).toBe("65.00");
    expect(result.value.ftf.finalAmount.toFixed(2)).toBe("685.00");

    // Sanity-check the underlying month-by-month math this result depends on.
    expect(result.value.ftp.monthlyBreakdown).toHaveLength(3);
    expect(result.value.ftp.monthlyBreakdown[0]?.balanceAtStart.toFixed(2)).toBe("5000.00");
    expect(result.value.ftp.monthlyBreakdown[1]?.balanceAtStart.toFixed(2)).toBe("5000.00"); // June-1 payment lands inside month 2, doesn't reduce its own start balance
    expect(result.value.ftp.monthlyBreakdown[2]?.balanceAtStart.toFixed(2)).toBe("3000.00"); // reflects the June-1 payment

    expect(result.value.ftf.monthsLate).toBe(3);
    expect(result.value.ftf.grossTotal.toFixed(2)).toBe("750.00"); // 5% x 3 x 5000
    expect(result.value.ftf.coordinationReduction.toFixed(2)).toBe("65.00");
  });
});
