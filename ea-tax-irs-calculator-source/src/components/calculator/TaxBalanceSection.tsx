import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { TextInput } from "@/components/ui/Field";
import type { CalculatorFormValues } from "@/lib/validation";

interface Props {
  register: UseFormRegister<CalculatorFormValues>;
  errors: FieldErrors<CalculatorFormValues>;
}

export function TaxBalanceSection({ register, errors }: Props) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-semibold text-ea-evergreen">Tax balance</legend>
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Tax year"
          inputMode="numeric"
          placeholder="2023"
          error={errors.taxYear?.message}
          {...register("taxYear")}
        />
      </div>
      <TextInput
        label="Tax required to be shown on the return"
        leadingText="$"
        inputMode="decimal"
        placeholder="0.00"
        required
        error={errors.taxRequiredToBeShown?.message}
        {...register("taxRequiredToBeShown")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label="Federal withholding"
          leadingText="$"
          inputMode="decimal"
          placeholder="0.00"
          tooltip="Withholding is treated as paid timely regardless of when it was withheld."
          error={errors.withholding?.message}
          {...register("withholding")}
        />
        <TextInput
          label="Timely estimated-tax payments"
          leadingText="$"
          inputMode="decimal"
          placeholder="0.00"
          error={errors.timelyEstimatedPayments?.message}
          {...register("timelyEstimatedPayments")}
        />
        <TextInput
          label="Refundable credits"
          leadingText="$"
          inputMode="decimal"
          placeholder="0.00"
          error={errors.refundableCredits?.message}
          {...register("refundableCredits")}
        />
        <TextInput
          label="Other timely payments"
          leadingText="$"
          inputMode="decimal"
          placeholder="0.00"
          tooltip="Payments made on or before the original payment due date."
          error={errors.otherTimelyPayments?.message}
          {...register("otherTimelyPayments")}
        />
      </div>
    </fieldset>
  );
}
