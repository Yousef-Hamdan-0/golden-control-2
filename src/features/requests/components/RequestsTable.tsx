"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SkeletonRow } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import { EmptyState } from "@/features/operations/components/shared/EmptyState";
import { Icon } from "@/lib/icons";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  type RepairRequest,
} from "@/models/requests/request.model";
import {
  primaryDevice,
  technicianDisplayName,
} from "@/features/requests/components/request-display.helpers";

interface RequestsTableProps {
  requests: RepairRequest[];
  isLoading: boolean;
  currentPage: number;
  totalRequests: number;
  usersById: Map<string, string>;
  pdfRequestId: string | null;
  onPage: (page: number) => void;
  onDetails: (request: RepairRequest) => void;
  /** Omitted for roles that cannot edit (technician). */
  onEdit?: (request: RepairRequest) => void;
  /** Omitted for roles that cannot download the PDF (technician). */
  onDownloadPdf?: (request: RepairRequest) => void;
}

export function RequestsTable({
  requests,
  isLoading,
  currentPage,
  totalRequests,
  usersById,
  pdfRequestId,
  onPage,
  onDetails,
  onEdit,
  onDownloadPdf,
}: RequestsTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-surface-2 text-content-muted">
              {[
                "رقم الطلب",
                "العميل",
                "عنوان العميل",
                "الجهاز",
                "الفني",
                "الحالة",
                "الإجراءات",
              ].map((header) => (
                <th key={header} className="px-2.5 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <SkeletonRow key={index} cols={7} />
              ))
            ) : requests.length ? (
              requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-border hover:bg-gold-soft"
                >
                  <td className="px-2.5 py-4 font-bold text-gold" dir="ltr">
                    {request.requestNumber}
                  </td>
                  <td className="max-w-[150px] px-2.5 py-4">
                    <div className="max-w-[140px] font-semibold text-content">
                      {request.customer.name}
                    </div>
                    <div className="max-w-[140px] text-xs text-content-muted" dir="ltr">
                      {request.customer.firstPhone || "غير محدد"}
                    </div>
                  </td>
                  {/* Exception to the app-wide truncation: the customer
                      address wraps onto a second line (max 2) instead of
                      being clipped to a single ellipsised line. */}
                  <td className="w-[180px] max-w-[180px] whitespace-normal px-2.5 py-4 text-content-muted">
                    <div className="line-clamp-2 !whitespace-normal break-words leading-5">
                      {request.customer.address || "غير محدد"}
                    </div>
                  </td>
                  <td className="max-w-[130px] px-2.5 py-4 text-content-muted">
                    {primaryDevice(request)}
                  </td>
                  <td className="max-w-[120px] px-2.5 py-4 text-content">
                    {technicianDisplayName(request, usersById)}
                  </td>
                  <td className="px-2.5 py-4">
                    <Badge tone={REQUEST_STATUS_TONE[request.status]} dot>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="flex items-center justify-start gap-1" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${request.requestNumber}`}
                        title="تفاصيل الطلب"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDetails(request);
                        }}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      {onEdit ? (
                        <button
                          type="button"
                          aria-label={`تعديل ${request.requestNumber}`}
                          title="تعديل"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(request);
                          }}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                      ) : null}
                      {onDownloadPdf ? (
                        <button
                          type="button"
                          aria-label={`PDF ${request.requestNumber}`}
                          title="تنزيل PDF"
                          disabled={pdfRequestId === request.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDownloadPdf(request);
                          }}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2 disabled:opacity-50"
                        >
                          <Icon name="file" size={18} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>
      {!isLoading && requests.length === 0 ? (
        <EmptyState title="لا توجد طلبات مطابقة للفلاتر." />
      ) : null}
      <TablePagination
        page={currentPage}
        total={totalRequests}
        pageSize={PAGE_SIZE}
        onPage={onPage}
        itemLabel="طلب"
      />
    </Card>
  );
}
