"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/lib/icons";
import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import {
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  REQUEST_TYPE_LABELS,
  type RepairRequest,
  type RepairRequestStatusHistoryItem,
} from "@/models/requests/request.model";

function fallback(value: string, empty = "غير محدد") {
  return value.trim() || empty;
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "غير محدد";
}

export function RequestDetailsModal({
  request,
  isLoading,
  errorMessage,
  statusHistory,
  statusHistoryLoading,
  statusHistoryError,
  downloadingPdf,
  onClose,
  onEdit,
  onDownloadPdf,
  onUploadRecords,
}: {
  request: RepairRequest | null;
  isLoading: boolean;
  errorMessage?: string;
  statusHistory: RepairRequestStatusHistoryItem[];
  statusHistoryLoading: boolean;
  statusHistoryError?: string;
  downloadingPdf: boolean;
  onClose: () => void;
  onEdit: (request: RepairRequest) => void;
  onDownloadPdf: (request: RepairRequest) => void;
  onUploadRecords: (request: RepairRequest) => void;
}) {
  return (
    <Modal
      title={request ? `تفاصيل الطلب ${request.requestNumber}` : "تفاصيل الطلب"}
      description="بيانات العميل، الأجهزة، الحالة، سجل الحالة، والتسجيلات الصوتية."
      onClose={onClose}
      widthClassName="max-w-5xl"
    >
      <div className="space-y-5 p-5">
        {errorMessage ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            تعذر تحميل تفاصيل الطلب. {errorMessage}
          </div>
        ) : null}

        {!request && isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-md border border-border bg-surface-2 p-8 text-sm text-content-muted">
            <Spinner />
            جاري تحميل بيانات الطلب...
          </div>
        ) : null}

        {request ? (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border pb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUploadRecords(request)}
              >
                <Icon name="plus" size={16} />
                تسجيلات صوتية
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloadingPdf}
                onClick={() => onDownloadPdf(request)}
              >
                <Icon name="file" size={16} />
                {downloadingPdf ? "جاري التحميل..." : "PDF"}
              </Button>
              <Button type="button" size="sm" onClick={() => onEdit(request)}>
                <Icon name="pencil" size={16} />
                تعديل
              </Button>
            </div>

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
                <DetailItem label="الفني" value={fallback(request.technicianName)} />
                <DetailItem label="تاريخ الإنشاء" value={formatDate(request.createdAt)} />
                <DetailItem label="آخر تعديل" value={formatDate(request.updatedAt)} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailItem label="اسم العميل" value={fallback(request.customer.name)} />
                <DetailItem label="الهاتف الأول" value={fallback(request.customer.firstPhone)} ltr />
                <DetailItem label="الهاتف الثاني" value={fallback(request.customer.secondPhone, "لا يوجد")} ltr />
                <DetailItem label="العنوان" value={fallback(request.customer.address)} />
                <DetailItem
                  label="رابط الموقع"
                  value={
                    request.customer.locationLink ? (
                      <a
                        href={request.customer.locationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold underline-offset-4 hover:underline"
                      >
                        فتح الموقع
                      </a>
                    ) : (
                      "لا يوجد"
                    )
                  }
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-heading text-base font-bold text-gold">الأجهزة</h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-[760px] w-full text-right text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-content-muted">
                      {["نوع الجهاز", "اسم الجهاز", "العلامة التجارية", "الموديل"].map((header) => (
                        <th key={header} className="px-4 py-3 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {request.devices.length ? (
                      request.devices.map((device, index) => (
                        <tr key={`${device.deviceName}-${index}`} className="border-t border-border">
                          <td className="px-4 py-3 text-content-muted">{fallback(device.deviceType)}</td>
                          <td className="px-4 py-3 font-semibold text-content">{fallback(device.deviceName)}</td>
                          <td className="px-4 py-3 text-content-muted">{fallback(device.brand)}</td>
                          <td className="px-4 py-3 text-content-muted">{fallback(device.model)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={4}>
                          لا توجد أجهزة مرتبطة بهذا الطلب.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border bg-surface-2 p-4">
                <h3 className="font-heading text-base font-bold text-content">وصف العطل</h3>
                <p className="mt-3 text-sm leading-7 text-content-muted">
                  {fallback(request.faultDescription, "لا يوجد وصف عطل.")}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-4">
                <h3 className="font-heading text-base font-bold text-content">ملاحظات</h3>
                <p className="mt-3 text-sm leading-7 text-content-muted">
                  {fallback(request.notes, "لا توجد ملاحظات.")}
                </p>
              </div>
            </section>

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
                          <td className="px-4 py-3 text-content">{fallback(item.owner)}</td>
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

            <section className="space-y-3">
              <h3 className="font-heading text-base font-bold text-gold">التسجيلات الصوتية</h3>
              <div className="divide-y divide-border rounded-md border border-border">
                {request.records.length ? (
                  request.records.map((record) => (
                    <div key={record.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_2fr] md:items-center">
                      <DetailItem label="الاسم" value={fallback(record.name)} />
                      <DetailItem label="التاريخ" value={formatDate(record.createdAt)} />
                      {record.url ? (
                        <audio controls preload="none" src={record.url} className="h-10 w-full" />
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
          </>
        ) : null}
      </div>
    </Modal>
  );
}
