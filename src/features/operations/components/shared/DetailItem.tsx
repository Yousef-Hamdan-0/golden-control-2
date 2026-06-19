import type { ReactNode } from "react";

export function DetailItem({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <div className="text-xs text-content-muted">{label}</div>
      <div className="mt-1 font-semibold text-content" dir={ltr ? "ltr" : "rtl"}>
        {value}
      </div>
    </div>
  );
}
