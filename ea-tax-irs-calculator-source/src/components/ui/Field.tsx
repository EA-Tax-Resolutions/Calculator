import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { HelpCircle } from "lucide-react";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  tooltip?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function FieldWrapper({ label, hint, error, tooltip, required, children }: FieldWrapperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-ea-evergreen">
        {label}
        {required && <span aria-hidden="true" className="text-ea-coral">*</span>}
        {tooltip && (
          <span className="group relative inline-flex">
            <HelpCircle size={14} className="text-ea-muted cursor-help" aria-hidden="true" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-control border border-ea-border bg-white p-2 text-xs font-normal text-ea-black opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {tooltip}
            </span>
          </span>
        )}
      </label>
      {children(id, describedBy)}
      {hint && (
        <p id={hintId} className="text-xs text-ea-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-ea-coral">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "min-h-11 rounded-control border border-ea-border bg-white px-3 py-2 text-sm text-ea-black placeholder:text-ea-muted/70 focus:outline-none focus:ring-2 focus:ring-ea-green focus:border-ea-green";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  tooltip?: string;
  required?: boolean;
  leadingText?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, error, tooltip, required, leadingText, className = "", ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} tooltip={tooltip} required={required}>
      {(id, describedBy) => (
        <div className="relative flex items-center">
          {leadingText && (
            <span className="pointer-events-none absolute left-3 text-sm text-ea-muted">{leadingText}</span>
          )}
          <input
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            className={`${inputBase} w-full ${leadingText ? "pl-6" : ""} ${className}`}
            {...props}
          />
        </div>
      )}
    </FieldWrapper>
  );
});

export const DateInput = forwardRef<HTMLInputElement, TextInputProps>(function DateInput(props, ref) {
  return <TextInput ref={ref} type="date" {...props} />;
});

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className = "", ...props },
  ref,
) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={`mt-0.5 h-5 w-5 shrink-0 rounded border-ea-border text-ea-green focus:ring-2 focus:ring-ea-green ${className}`}
        {...props}
      />
      <label htmlFor={id} className="text-sm text-ea-black">
        {label}
        {hint && <span className="block text-xs text-ea-muted">{hint}</span>}
      </label>
    </div>
  );
});
