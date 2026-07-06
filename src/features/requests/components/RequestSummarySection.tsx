"use client";

import { Badge } from "@/components/ui/Badge";
import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import {
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  REQUEST_TYPE_LABELS,
  type RepairRequest,
} from "@/models/requests/request.model";
import {
  fallback,
  formatDate,
  formatDateTime,
} from "@/features/requests/components/request-details.helpers";

export function RequestSummarySection({
  request,
  technicianDisplayName,
}: {
  request: RepairRequest;
  technicianDisplayName?: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold text-gold">بيانات الطلب</h3>
      <div className="grid gap-3 md:grid-cols-4">
        <DetailItem label="رقم الطلب" value={request.requestNumber} ltr />
        <DetailItem label="نوع الطلب" value={REQUEST_TYPE_LABELS[request.type]} />
        <DetailItem
          label="الحالة"
          value={
            <Badge tone={REQUEST_STATUS_TONE[request.status]} dot>
              {REQUEST_STATUS_LABELS[request.status]}
            </Badge>
          }
        />
        <DetailItem
          label="الأولوية"
          value={
            <Badge tone={request.priority === "emergency" ? "danger" : "neutral"}>
              {REQUEST_PRIORITY_LABELS[request.priority]}
            </Badge>
          }
        />
        <DetailItem label="تاريخ الصيانة" value={formatDate(request.scheduledDate)} />
        <DetailItem label="الفني" value={fallback(technicianDisplayName ?? request.technicianName)} />
        <DetailItem label="وقت الإنشاء" value={formatDateTime(request.createdAt)} />
        <DetailItem label="وقت التعديل" value={formatDateTime(request.updatedAt || request.createdAt)} />
      </div>
    </section>
  );
}
