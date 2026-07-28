import { z } from "zod";
import { parseISODate } from "@/calculation/dates";
import { money, rate } from "@/calculation/money";
import type { EstimateInput, PaymentInput } from "@/calculation/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");
const moneyString = z
  .string()
  .trim()
  .refine((v) => v === "" || /^-?\d+(\.\d{1,2})?$/.test(v), "Enter a dollar amount.");

const paymentSchema = z.object({
  id: z.string(),
  date: isoDate,
  amount: moneyString.refine((v) => v !== "" && Number(v) >= 0, "Payment amount cannot be negative."),
  note: z.string().max(200).optional(),
});

export const calculatorFormSchema = z
  .object({
    taxYear: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit tax year."),
    taxRequiredToBeShown: moneyString.refine((v) => v !== "", "Enter the tax shown on the return."),
    withholding: moneyString,
    timelyEstimatedPayments: moneyString,
    refundableCredits: moneyString,
    otherTimelyPayments: moneyString,

    originalPaymentDueDate: isoDate,
    originalFilingDueDate: isoDate,
    hasValidExtension: z.boolean(),
    extendedFilingDueDate: isoDate.optional().or(z.literal("")),

    returnStatus: z.enum(["filed", "not_filed"]),
    actualFiledDate: isoDate.optional().or(z.literal("")),
    calculationThroughDate: isoDate,

    payments: z.array(paymentSchema),

    hasInstallmentAgreement: z.boolean(),
    installmentAgreementStartDate: isoDate.optional().or(z.literal("")),
    installmentAgreementEndDate: isoDate.optional().or(z.literal("")),
    wasFiledTimely: z.boolean(),
    hasLevyNotice: z.boolean(),
    levyNoticeDate: isoDate.optional().or(z.literal("")),
    hasNoticeAndDemand: z.boolean(),
    noticeAndDemandDate: isoDate.optional().or(z.literal("")),
    noticeAndDemandAmount: moneyString,
    hasManualRateOverride: z.boolean(),
    manualInterestRateOverridePercent: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d+(\.\d{1,3})?$/.test(v), "Enter a percentage."),

    illustrativeRelief: z.enum(["none", "FTF", "FTP", "BOTH"]),
  })
  .superRefine((data, ctx) => {
    if (data.hasValidExtension && !data.extendedFilingDueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["extendedFilingDueDate"],
        message: "Enter the extended filing due date.",
      });
    }
    if (data.returnStatus === "filed" && !data.actualFiledDate) {
      ctx.addIssue({ code: "custom", path: ["actualFiledDate"], message: "Enter the actual filing date." });
    }
    if (data.hasInstallmentAgreement && !data.installmentAgreementStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["installmentAgreementStartDate"],
        message: "Enter the installment agreement start date.",
      });
    }
    if (data.hasLevyNotice && !data.levyNoticeDate) {
      ctx.addIssue({ code: "custom", path: ["levyNoticeDate"], message: "Enter the levy notice date." });
    }
    if (data.hasNoticeAndDemand && !data.noticeAndDemandDate) {
      ctx.addIssue({ code: "custom", path: ["noticeAndDemandDate"], message: "Enter the notice and demand date." });
    }
  });

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>;

export function defaultFormValues(): CalculatorFormValues {
  return {
    taxYear: String(new Date().getFullYear() - 1),
    taxRequiredToBeShown: "",
    withholding: "",
    timelyEstimatedPayments: "",
    refundableCredits: "",
    otherTimelyPayments: "",
    originalPaymentDueDate: "",
    originalFilingDueDate: "",
    hasValidExtension: false,
    extendedFilingDueDate: "",
    returnStatus: "filed",
    actualFiledDate: "",
    calculationThroughDate: "",
    payments: [],
    hasInstallmentAgreement: false,
    installmentAgreementStartDate: "",
    installmentAgreementEndDate: "",
    wasFiledTimely: true,
    hasLevyNotice: false,
    levyNoticeDate: "",
    hasNoticeAndDemand: false,
    noticeAndDemandDate: "",
    noticeAndDemandAmount: "",
    hasManualRateOverride: false,
    manualInterestRateOverridePercent: "",
    illustrativeRelief: "none",
  };
}

function toMoneyOrZero(v: string) {
  return money(v === "" ? 0 : v);
}

/** Converts validated raw form strings into the calculation engine's typed EstimateInput. */
export function toEstimateInput(values: CalculatorFormValues): EstimateInput {
  const originalPaymentDueDate = parseISODate(values.originalPaymentDueDate);
  const filingDueDate = values.hasValidExtension && values.extendedFilingDueDate
    ? parseISODate(values.extendedFilingDueDate)
    : parseISODate(values.originalFilingDueDate);

  const payments: PaymentInput[] = values.payments
    .filter((p) => p.date && p.amount !== "")
    .map((p) => ({ id: p.id, date: parseISODate(p.date), amount: money(p.amount), note: p.note }));

  const input: EstimateInput = {
    dueDates: { originalPaymentDueDate, filingDueDate },
    hasValidExtension: values.hasValidExtension,
    taxRequiredToBeShown: toMoneyOrZero(values.taxRequiredToBeShown),
    withholding: toMoneyOrZero(values.withholding),
    timelyEstimatedPayments: toMoneyOrZero(values.timelyEstimatedPayments),
    refundableCredits: toMoneyOrZero(values.refundableCredits),
    otherTimelyPayments: toMoneyOrZero(values.otherTimelyPayments),
    returnFiled: values.returnStatus === "filed",
    actualFiledDate: values.actualFiledDate ? parseISODate(values.actualFiledDate) : null,
    calculationThroughDate: parseISODate(values.calculationThroughDate),
    payments,
    wasFiledTimely: values.wasFiledTimely,
  };

  if (values.hasInstallmentAgreement && values.installmentAgreementStartDate) {
    input.installmentAgreement = {
      approvedDate: parseISODate(values.installmentAgreementStartDate),
      endDate: values.installmentAgreementEndDate ? parseISODate(values.installmentAgreementEndDate) : undefined,
    };
  }
  if (values.hasLevyNotice && values.levyNoticeDate) {
    input.levyNoticeDate = parseISODate(values.levyNoticeDate);
  }
  if (values.hasNoticeAndDemand && values.noticeAndDemandDate) {
    input.noticeAndDemandDate = parseISODate(values.noticeAndDemandDate);
    if (values.noticeAndDemandAmount !== "") {
      input.noticeAndDemandAmount = money(values.noticeAndDemandAmount);
    }
  }
  if (values.hasManualRateOverride && values.manualInterestRateOverridePercent !== "") {
    input.manualInterestRateOverride = rate(values.manualInterestRateOverridePercent).dividedBy(100) as ReturnType<typeof rate>;
  }

  return input;
}
