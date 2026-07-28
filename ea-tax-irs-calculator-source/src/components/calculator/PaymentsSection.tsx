"use client";

import { useFieldArray } from "react-hook-form";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import { TextInput, DateInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { CalculatorFormValues } from "@/lib/validation";

interface Props {
  control: Control<CalculatorFormValues>;
  register: UseFormRegister<CalculatorFormValues>;
  errors: FieldErrors<CalculatorFormValues>;
}

export function PaymentsSection({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "payments" });

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-semibold text-ea-evergreen">Payments after the due date</legend>
      <p className="text-xs text-ea-muted">
        Enter each payment made after the original payment due date. You can add as many as you need.
      </p>

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 items-start gap-2 rounded-control border border-ea-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <DateInput
              label="Payment date"
              error={errors.payments?.[index]?.date?.message}
              {...register(`payments.${index}.date` as const)}
            />
            <TextInput
              label="Amount"
              leadingText="$"
              inputMode="decimal"
              placeholder="0.00"
              error={errors.payments?.[index]?.amount?.message}
              {...register(`payments.${index}.amount` as const)}
            />
            <TextInput label="Note (optional)" placeholder="e.g. wire transfer" {...register(`payments.${index}.note` as const)} />
            <div className="flex items-end pb-1.5 sm:justify-center">
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove payment ${index + 1}`}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-ea-coral hover:bg-ea-coral/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ea-coral"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        onClick={() => append({ id: crypto.randomUUID(), date: "", amount: "", note: "" })}
      >
        <Plus size={16} aria-hidden="true" />
        Add payment
      </Button>
    </fieldset>
  );
}
