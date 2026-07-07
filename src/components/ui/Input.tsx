import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  applyArabicValidationMessage,
  clearCustomValidity,
} from "@/lib/forms/native-validation";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, onInvalid, onInput, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-content",
        "text-right placeholder:text-right placeholder:text-content-muted",
        "transition-shadow duration-150 ease-out",
        "focus:border-primary focus:bg-surface focus:outline-none",
        "focus:ring-[3px] focus:ring-gold/15",
        className,
      )}
      onInvalid={(event) => {
        applyArabicValidationMessage(event.currentTarget);
        onInvalid?.(event);
      }}
      onInput={(event) => {
        clearCustomValidity(event.currentTarget);
        onInput?.(event);
      }}
      {...props}
    />
  ),
);
Input.displayName = "Input";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label-above field wrapper with inline error (design.md rule). */
export function Field({ label, htmlFor, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm text-content-muted">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
