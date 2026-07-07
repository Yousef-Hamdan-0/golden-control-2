import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/lib/icons";
import {
  applyArabicValidationMessage,
  clearCustomValidity,
} from "@/lib/forms/native-validation";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, onInvalid, onInput, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-border bg-surface-2 px-3 pl-9 text-sm text-content",
          "transition-shadow duration-150 ease-out",
          "focus:border-primary focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-gold/15",
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
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
      />
    </div>
  ),
);
Select.displayName = "Select";
