import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader title={title} subtitle={subtitle} />
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
