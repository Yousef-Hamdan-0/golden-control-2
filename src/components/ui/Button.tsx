import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-white hover:bg-gold-hover active:bg-gold-active shadow-card hover:shadow-gold",
  outline:
    "border border-gold text-gold bg-transparent hover:bg-gold-soft",
  ghost: "text-gold bg-transparent hover:bg-gold-soft",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger-soft",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-body font-medium",
        "transition-all duration-200 ease-out focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-9 px-4 text-sm" : "h-11 px-6 text-sm",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
