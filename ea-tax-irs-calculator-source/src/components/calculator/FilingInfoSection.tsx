import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { DateInput, Checkbox } from "@/components/ui/Field";
import type { CalculatorFormValues } from "@/lib/validation";

interface Props {
  register: UseFormRegister<CalculatorFormValues>;
  errors: FieldErrors<CalculatorFormValues>;
  watch: UseFormWatch<CalculatorFormValues>;
}

export function FilingInfoSection({ register, errors, watch }: Props) {
  const hasValidExtension = watch("hasValidExtension");
  const returnStatus = watch("returnStatus");

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-semibold text-ea-evergreen">Filing information</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateInput
          label="Original payment due date"
          required
          error={errors.originalPaymentDueDate?.message}
          {...register("originalPaymentDueDate")}
        />
        <DateInput
          label="Original filing due date"
          required
          error={errors.originalFilingDueDate?.message}
          {...register("originalFilingDueDate")}
        />
      </div>

      <Checkbox label="The taxpayer had a valid filing extension" {...register("hasValidExtension")} />
      {hasValidExtension && (
        <DateInput
          label="Extended filing due date"
          required
          error={errors.extendedFilingDueDate?.message}
          {...register("extendedFilingDueDate")}
        />
      )}
      <p className="text-xs text-ea-muted">
        A filing extension generally extends the time to file, not the time to pay.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ea-evergreen">Return status</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="filed" className="h-4 w-4 text-ea-green" {...register("returnStatus")} />
            Filed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="not_filed" className="h-4 w-4 text-ea-green" {...register("returnStatus")} />
            Not yet filed
          </label>
        </div>
      </div>

      {returnStatus === "filed" && (
        <DateInput
          label="Actual filing date"
          required
          error={errors.actualFiledDate?.message}
          {...register("actualFiledDate")}
        />
      )}

      <DateInput
        label="Calculation-through date"
        required
        hint="The date you want the estimate calculated through."
        error={errors.calculationThroughDate?.message}
        {...register("calculationThroughDate")}
      />
    </fieldset>
  );
}
