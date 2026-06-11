import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-content",
      "placeholder:text-content-muted",
      "transition-shadow duration-150 ease-out",
      "focus:border-primary focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-gold/15",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
