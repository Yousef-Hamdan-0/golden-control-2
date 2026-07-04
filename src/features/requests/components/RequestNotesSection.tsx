"use client";

import { fallback } from "@/features/requests/components/request-details.helpers";

export function RequestNotesSection({
  faultDescription,
  notes,
}: {
  faultDescription: string;
  notes: string;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-border bg-surface-2 p-4">
        <h3 className="font-heading text-base font-bold text-content">وصف العطل</h3>
        <p className="mt-3 text-sm leading-7 text-content-muted">
          {fallback(faultDescription, "لا يوجد وصف عطل.")}
        </p>
      </div>
      <div className="rounded-md border border-border bg-surface-2 p-4">
        <h3 className="font-heading text-base font-bold text-content">ملاحظات</h3>
        <p className="mt-3 text-sm leading-7 text-content-muted">
          {fallback(notes, "لا توجد ملاحظات.")}
        </p>
      </div>
    </section>
  );
}
