import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "success" | "danger" | "gold" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-content border border-border",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  gold: "bg-gold-soft text-gold",
  info: "bg-info-soft text-info",
};

const DOT: Record<BadgeTone, string> = {
  neutral: "bg-content-muted",
  success: "bg-success",
  danger: "bg-danger",
  gold: "bg-gold",
  info: "bg-info",
};

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}
