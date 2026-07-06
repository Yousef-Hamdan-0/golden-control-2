"use client";

import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import type { RepairRequestRecord } from "@/models/requests/request.model";
import { fallback, formatDateTime } from "@/features/requests/components/request-details.helpers";
import { AuthenticatedAudioPlayer } from "@/components/media/AuthenticatedAudioPlayer";

export function RequestRecordsSection({
  records,
}: {
  records: RepairRequestRecord[];
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold text-gold">التسجيلات الصوتية</h3>
      <div className="divide-y divide-border rounded-md border border-border">
        {records.length ? (
          records.map((record) => (
            <div key={record.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_2fr] md:items-center">
              <DetailItem label="الاسم" value={fallback(record.name)} />
              <DetailItem label="وقت الإنشاء" value={formatDateTime(record.createdAt)} />
              {record.url ? (
                <AuthenticatedAudioPlayer url={record.url} />
              ) : (
                <div className="text-sm text-content-muted">لا يوجد رابط تشغيل.</div>
              )}
            </div>
          ))
        ) : (
          <div className="p-5 text-center text-sm text-content-muted">
            لا توجد تسجيلات صوتية مرتبطة بهذا الطلب.
          </div>
        )}
      </div>
    </section>
  );
}
