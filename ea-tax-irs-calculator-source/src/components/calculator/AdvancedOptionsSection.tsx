import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { DateInput, TextInput, Checkbox } from "@/components/ui/Field";
import type { CalculatorFormValues } from "@/lib/validation";

interface Props {
  register: UseFormRegister<CalculatorFormValues>;
  errors: FieldErrors<CalculatorFormValues>;
  watch: UseFormWatch<CalculatorFormValues>;
}

export function AdvancedOptionsSection({ register, errors, watch }: Props) {
  const hasInstallmentAgreement = watch("hasInstallmentAgreement");
  const hasLevyNotice = watch("hasLevyNotice");
  const hasNoticeAndDemand = watch("hasNoticeAndDemand");
  const hasManualRateOverride = watch("hasManualRateOverride");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Checkbox label="Approved installment agreement" {...register("hasInstallmentAgreement")} />
        {hasInstallmentAgreement && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput
              label="Installment agreement start date"
              required
              error={errors.installmentAgreementStartDate?.message}
              {...register("installmentAgreementStartDate")}
            />
            <DateInput label="Installment agreement end date (optional)" {...register("installmentAgreementEndDate")} />
          </div>
        )}
      </div>

      <Checkbox
        label="The individual return was filed timely, including any valid extension"
        hint="Required, together with an active installment agreement, for the reduced 0.25% monthly failure-to-pay rate. An installment agreement date alone is not enough."
        {...register("wasFiledTimely")}
      />

      <div>
        <Checkbox label="IRS notice of intent to levy was issued" {...register("hasLevyNotice")} />
        {hasLevyNotice && (
          <div className="mt-3">
            <DateInput
              label="Notice of intent to levy date"
              required
              error={errors.levyNoticeDate?.message}
              {...register("levyNoticeDate")}
            />
          </div>
        )}
      </div>

      <div>
        <Checkbox
          label="IRS notice and demand was issued for the failure-to-pay penalty"
          hint="Required before interest on the failure-to-pay penalty can be included."
          {...register("hasNoticeAndDemand")}
        />
        {hasNoticeAndDemand && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput
              label="Notice and demand date"
              required
              error={errors.noticeAndDemandDate?.message}
              {...register("noticeAndDemandDate")}
            />
            <TextInput
              label="Amount stated in the notice (optional)"
              leadingText="$"
              inputMode="decimal"
              hint="Defaults to the computed failure-to-pay penalty. Determines whether the 21-day or 10-business-day grace period applies."
              {...register("noticeAndDemandAmount")}
            />
          </div>
        )}
      </div>

      <div>
        <Checkbox label="Override the IRS quarterly interest rate manually" {...register("hasManualRateOverride")} />
        {hasManualRateOverride && (
          <div className="mt-3">
            <TextInput
              label="Manual annual interest rate"
              leadingText="%"
              inputMode="decimal"
              hint="Only used for any period beyond the last verified IRS quarterly rate."
              {...register("manualInterestRateOverridePercent")}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ea-evergreen">
          Show an illustrative result if selected penalties were removed
        </span>
        <select
          className="min-h-11 rounded-control border border-ea-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ea-green"
          {...register("illustrativeRelief")}
        >
          <option value="none">None</option>
          <option value="FTF">Failure-to-file penalty</option>
          <option value="FTP">Failure-to-pay penalty</option>
          <option value="BOTH">Both penalties</option>
        </select>
        <p className="text-xs text-ea-muted">
          This scenario does not determine whether you qualify for penalty relief. Eligibility depends on
          the account history, penalty type, facts, and supporting information. The IRS makes the final
          decision.
        </p>
      </div>
    </div>
  );
}
