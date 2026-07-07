"use client";

import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import type { RepairRequestRecord } from "@/models/requests/request.model";
import { fallback, formatDateTime } from "@/features/requests/components/request-details.helpers";
import { AuthenticatedAudioPlayer } from "@/components/media/AuthenticatedAudioPlayer";

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

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
            <div
              key={record.id}
              className="grid gap-3 p-4 md:grid-cols-[1.2fr_1.2fr_0.8fr_2fr] md:items-center"
            >
              <DetailItem label="الاسم" value={fallback(record.name)} />
              <DetailItem label="وقت الإنشاء" value={formatDateTime(record.createdAt)} />
              <DetailItem label="المدة" value={fallback(formatDuration(record.duration))} />
              {record.url ? (
                <AuthenticatedAudioPlayer url={record.url} mimeType={record.mimeType} />
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
