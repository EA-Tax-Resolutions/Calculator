import { parseISODate } from "@/calculation/dates";
import { money, ZERO } from "@/calculation/money";
import type { EstimateInput } from "@/calculation/types";

/** Base fixture with every field defaulted to "no effect," so each test only overrides what it's testing. */
export function baseInput(overrides: Partial<EstimateInput> = {}): EstimateInput {
  const defaults: EstimateInput = {
    dueDates: {
      originalPaymentDueDate: parseISODate("2022-04-15"),
      filingDueDate: parseISODate("2022-04-15"),
    },
    hasValidExtension: false,
    taxRequiredToBeShown: ZERO,
    withholding: ZERO,
    timelyEstimatedPayments: ZERO,
    refundableCredits: ZERO,
    otherTimelyPayments: ZERO,
    returnFiled: true,
    actualFiledDate: parseISODate("2022-04-15"),
    calculationThroughDate: parseISODate("2022-04-15"),
    payments: [],
    wasFiledTimely: true,
  };
  return { ...defaults, ...overrides };
}

export const usd = money;
export const d = parseISODate;
