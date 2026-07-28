"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardBody } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { TaxBalanceSection } from "@/components/calculator/TaxBalanceSection";
import { FilingInfoSection } from "@/components/calculator/FilingInfoSection";
import { PaymentsSection } from "@/components/calculator/PaymentsSection";
import { AdvancedOptionsSection } from "@/components/calculator/AdvancedOptionsSection";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { IllustrativeRelief } from "@/components/results/IllustrativeRelief";
import { calculatorFormSchema, defaultFormValues, toEstimateInput } from "@/lib/validation";
import type { CalculatorFormValues } from "@/lib/validation";
import { calculateEstimate, calculateIllustrativeRemoval } from "@/calculation/calculateEstimate";
import type { EstimateResult } from "@/calculation/types";
import { buildTextSummary, downloadCsv } from "@/lib/exportSummary";
import { track } from "@/lib/analytics";

export function CalculatorForm() {
  const {
    register,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: defaultFormValues(),
    mode: "onBlur",
  });

  // useForm's defaultValues fully populate every field, so the watched
  // snapshot is never actually partial at runtime even though useWatch's
  // generic type without a `name` is DeepPartial.
  const values = useWatch({ control }) as CalculatorFormValues;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current && values.taxRequiredToBeShown) {
      startedRef.current = true;
      track("calculator_started");
    }
  }, [values.taxRequiredToBeShown]);

  const ready =
    calculatorFormSchema.safeParse(values).success &&
    values.taxRequiredToBeShown !== "" &&
    values.originalPaymentDueDate !== "" &&
    values.originalFilingDueDate !== "" &&
    values.calculationThroughDate !== "";

  const result: EstimateResult | null = useMemo(() => {
    if (!ready) return null;
    try {
      const input = toEstimateInput(values);
      const outcome = calculateEstimate(input);
      return outcome.ok ? outcome.value : null;
    } catch {
      return null;
    }
  }, [ready, values]);

  const estimateCompletedRef = useRef(false);
  useEffect(() => {
    if (result && !estimateCompletedRef.current) {
      estimateCompletedRef.current = true;
      track("estimate_completed");
    }
  }, [result]);

  const illustrativeResult: EstimateResult | null = useMemo(() => {
    if (!result || values.illustrativeRelief === "none") return null;
    const input = toEstimateInput(values);
    const remove: Array<"FTF" | "FTP"> = values.illustrativeRelief === "BOTH" ? ["FTF", "FTP"] : [values.illustrativeRelief];
    const outcome = calculateIllustrativeRemoval(input, remove);
    return outcome.ok ? outcome.value : null;
  }, [result, values]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[58fr_42fr] lg:items-start lg:gap-10">
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardBody className="pt-5">
            <TaxBalanceSection register={register} errors={errors} />
          </CardBody>
        </Card>

        {result && (
          <p className="-mt-2 text-sm font-medium text-ea-evergreen">
            Original unpaid tax: {result.originalUnpaidTax.toFixed(2) === "0.00" ? "$0.00" : `$${result.originalUnpaidTax.toFixed(2)}`}
          </p>
        )}

        <Card>
          <CardBody className="pt-5">
            <FilingInfoSection register={register} errors={errors} watch={watch} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-5">
            <PaymentsSection control={control} register={register} errors={errors} />
          </CardBody>
        </Card>

        <Accordion title="Advanced options">
          <AdvancedOptionsSection register={register} errors={errors} watch={watch} />
        </Accordion>
      </form>

      <div className="flex flex-col gap-6">
        <ResultsPanel
          result={result}
          onReset={() => reset(defaultFormValues())}
          onCopySummary={() => {
            if (result) navigator.clipboard.writeText(buildTextSummary(result));
          }}
          onDownloadCsv={() => {
            if (result) downloadCsv(result);
          }}
        />
        {result && illustrativeResult && <IllustrativeRelief current={result} illustrative={illustrativeResult} />}
      </div>
    </div>
  );
}
