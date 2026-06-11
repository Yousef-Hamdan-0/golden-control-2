import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, dir = "rtl", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      dir={dir}
      className={cn(
        "rounded-md border border-border bg-surface text-right shadow-card",
        "transition-shadow duration-200 ease-out",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, dir = "rtl", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      dir={dir}
      className={cn(
        "rounded-t-md border-b border-border bg-surface-2 px-4 py-3 text-right",
        className,
      )}
      {...props}
    />
  );
}
