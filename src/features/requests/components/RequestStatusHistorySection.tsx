import { Badge } from "@/components/ui/Badge";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  type RepairRequestStatusHistoryItem,
} from "@/models/requests/request.model";
import {
  fallback,
  formatDate,
  statusHistoryOwner,
} from "@/features/requests/components/request-details.helpers";

interface RequestStatusHistorySectionProps {
  statusHistory: RepairRequestStatusHistoryItem[];
  statusHistoryLoading: boolean;
  statusHistoryError?: string;
  usersById: Map<string, string>;
}

export function RequestStatusHistorySection({
  statusHistory,
  statusHistoryLoading,
  statusHistoryError,
  usersById,
}: RequestStatusHistorySectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold text-gold">سجل الحالة</h3>
      {statusHistoryError ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
          تعذر تحميل سجل الحالة. {statusHistoryError}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[760px] w-full text-right text-sm">
          <thead>
            <tr className="bg-surface-2 text-content-muted">
              {["الحالة", "الملاحظة", "المسؤول", "التاريخ"].map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statusHistoryLoading ? (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-center text-content-muted" colSpan={4}>
                  جاري تحميل سجل الحالة...
                </td>
              </tr>
            ) : statusHistory.length ? (
              statusHistory.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Badge tone={REQUEST_STATUS_TONE[item.status]} dot>
                      {REQUEST_STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-content-muted">
                    {fallback(item.note, "لا توجد ملاحظة")}
                  </td>
                  <td className="px-4 py-3 text-content">
                    {statusHistoryOwner(item, usersById)}
                  </td>
                  <td className="px-4 py-3 text-content-muted">{formatDate(item.date)}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-center text-content-muted" colSpan={4}>
                  لا يوجد سجل حالة لهذا الطلب.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
