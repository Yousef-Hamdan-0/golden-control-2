"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { queryKeys } from "@/hooks/query-keys";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { localDateKey } from "@/lib/format/date";
import { invoiceService } from "@/services/invoice.service";
import {
  PAYMENT_LABELS,
  PAYMENT_TONE,
} from "@/features/operations/constants";
import type { Invoice, InvoicePayment } from "@/features/operations/types";
import {
  createInvoiceDraftFromRequest,
  remaining,
} from "@/features/operations/utils/invoice";
import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import { InvoiceDetailsModal } from "@/features/operations/components/invoices/InvoiceDetailsModal";
import { InvoiceFormModal } from "@/features/operations/components/invoices/InvoiceFormModal";
import { AddPaymentModal } from "@/features/operations/components/invoices/AddPaymentModal";
import {
  useInvoiceMutations,
  useInvoicePaymentsQuery,
  useInvoiceQuery,
} from "@/features/invoices/hooks/use-invoices";
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

function isLikelyIdentifier(value: string) {
  const trimmed = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    ) || /^[0-9a-f]{24}$/i.test(trimmed)
  );
}

function userDisplayName(value: string, usersById: Map<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const mapped = usersById.get(trimmed);
  if (mapped) return mapped;
  return isLikelyIdentifier(trimmed) ? "" : trimmed;
}

function statusHistoryOwner(
  item: RepairRequestStatusHistoryItem,
  usersById: Map<string, string>,
) {
  return (
    userDisplayName(item.ownerId, usersById) ||
    userDisplayName(item.owner, usersById) ||
    "غير محدد"
  );
}

function formatDate(value: string) {
  return localDateKey(value, "غير محدد");
}

function invoiceDisplayNumber(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.id;
}

function canCreateInvoiceForRequest(request: RepairRequest) {
  return ["new", "underrepair", "incompleted"].includes(request.status);
}

function canAddPayment(invoice: Invoice) {
  return invoice.status !== "paid" && invoice.status !== "refunded" && !invoice.returned;
}

function saveInvoicePdf(response: Awaited<ReturnType<typeof invoiceService.downloadPdf>>, invoice: Invoice) {
  const url = URL.createObjectURL(response.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = response.fileName ?? `${invoiceDisplayNumber(invoice)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RequestDetailsModal({
  request,
  isLoading,
  errorMessage,
  statusHistory,
  statusHistoryLoading,
  statusHistoryError,
  technicianDisplayName,
  usersById,
  downloadingPdf,
  onClose,
  onEdit,
  onDownloadPdf,
}: {
  request: RepairRequest | null;
  isLoading: boolean;
  errorMessage?: string;
  statusHistory: RepairRequestStatusHistoryItem[];
  statusHistoryLoading: boolean;
  statusHistoryError?: string;
  technicianDisplayName?: string;
  usersById?: Map<string, string>;
  downloadingPdf: boolean;
  onClose: () => void;
  onEdit: (request: RepairRequest) => void;
  onDownloadPdf: (request: RepairRequest) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [invoicePdfId, setInvoicePdfId] = useState<string | null>(null);
  const { create, recordPayment } = useInvoiceMutations();
  const invoices = request?.invoices ?? [];
  const hasPaidInvoice = invoices.some((invoice) => invoice.status === "paid");
  const canCreateRequestInvoice = Boolean(
    request && canCreateInvoiceForRequest(request) && !hasPaidInvoice,
  );
  const invoiceDraft = useMemo(
    () => (request ? createInvoiceDraftFromRequest(request) : null),
    [request],
  );
  const invoiceDetailQuery = useInvoiceQuery(viewingInvoice?.id ?? null);
  const invoicePaymentsQuery = useInvoicePaymentsQuery(viewingInvoice?.id ?? null);
  const activeViewingInvoice = invoiceDetailQuery.data ?? viewingInvoice;
  const activeViewingInvoiceWithPayments = activeViewingInvoice
    ? { ...activeViewingInvoice, payments: invoicePaymentsQuery.data ?? activeViewingInvoice.payments }
    : null;

  function showCreateInvoice() {
    if (!request || !invoiceDraft) return;
    setInvoiceNotice(null);

    if (!canCreateInvoiceForRequest(request)) {
      setInvoiceNotice("إنشاء الفاتورة متاح للطلب الجديد أو قيد الإصلاح أو غير مكتمل الدفع.");
      return;
    }

    if (hasPaidInvoice) {
      setInvoiceNotice("توجد فاتورة مدفوعة بالكامل لهذا الطلب، لذلك لا يمكن إنشاء فاتورة جديدة.");
      return;
    }

    create.reset();
    setShowInvoiceForm(true);
  }

  function saveInvoice(nextInvoice: Invoice) {
    if (!request) return;

    create.mutate(nextInvoice, {
      onSuccess: (createdInvoice) => {
        const linkedInvoice = {
          ...createdInvoice,
          orderId: createdInvoice.orderId || request.id,
          requestNumber: createdInvoice.requestNumber || request.requestNumber,
        };
        setShowInvoiceForm(false);
        setViewingInvoice(linkedInvoice);
        void queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(request.id) });
        toast.success("تم إنشاء الفاتورة", `تم إنشاء الفاتورة ${invoiceDisplayNumber(linkedInvoice)} للطلب ${request.requestNumber}.`);
      },
      onError: (error) => toast.error("تعذر إنشاء الفاتورة", getApiErrorMessage(error)),
    });
  }

  function savePayment(payment: InvoicePayment, convertedAmount: number) {
    if (!paymentInvoice) return;
    void convertedAmount;

    recordPayment.mutate(
      {
        invoiceId: paymentInvoice.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.method,
      },
      {
        onSuccess: () => {
          setPaymentInvoice(null);
          void queryClient.invalidateQueries({
            queryKey: queryKeys.requests.detail(request?.id ?? paymentInvoice.orderId),
          });
          toast.success("تم حفظ الدفعة", `تم تسجيل دفعة على الفاتورة ${invoiceDisplayNumber(paymentInvoice)} بنجاح.`);
        },
        onError: (error) => toast.error("تعذر حفظ الدفعة", getApiErrorMessage(error)),
      },
    );
  }

  async function downloadInvoicePdf(invoice: Invoice) {
    setInvoicePdfId(invoice.id);
    try {
      const response = await invoiceService.downloadPdf(invoice.id);
      saveInvoicePdf(response, invoice);
      toast.success("تم تنزيل PDF", `تم تجهيز الفاتورة ${invoiceDisplayNumber(invoice)}.`);
    } catch (error) {
      toast.error("تعذر تنزيل PDF", getApiErrorMessage(error));
    } finally {
      setInvoicePdfId(null);
    }
  }

  return (
    <>
      <Modal
        title="تفاصيل الطلب"
        description="بيانات العميل، الأجهزة، الحالة، سجل الحالة، الفواتير، والتسجيلات الصوتية."
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
                <DetailItem label="الفني" value={fallback(technicianDisplayName ?? request.technicianName)} />
                <DetailItem label="تاريخ الإنشاء" value={formatDate(request.createdAt)} />
                <DetailItem label="آخر تعديل" value={formatDate(request.updatedAt || request.createdAt)} />
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
                          <td className="px-4 py-3 text-content">
                            {statusHistoryOwner(item, usersById ?? new Map())}
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

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading text-base font-bold text-gold">سجل الفواتير</h3>
                {canCreateRequestInvoice ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={create.isPending}
                    onClick={showCreateInvoice}
                  >
                    <Icon name="plus" size={16} />
                    إنشاء فاتورة
                  </Button>
                ) : null}
              </div>

              {invoiceNotice ? (
                <div className="rounded-md border border-gold/30 bg-gold-soft p-3 text-sm font-medium text-gold-active">
                  {invoiceNotice}
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-[820px] w-full text-right text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-content-muted">
                      {["رقم الفاتورة", "الحالة", "الإجمالي", "المدفوع", "المتبقي", "التاريخ", "إجراءات"].map((header) => (
                        <th key={header} className="px-4 py-3 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length ? (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t border-border">
                          <td className="px-4 py-3 font-bold text-gold" dir="ltr">
                            {invoiceDisplayNumber(invoice)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                              {PAYMENT_LABELS[invoice.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {formatMoney(invoice.total, invoice.currency)}
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {formatMoney(invoice.paid, invoice.currency)}
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                          </td>
                          <td className="px-4 py-3 text-content-muted">{formatDate(invoice.issuedAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-start gap-2" dir="rtl">
                              <button
                                type="button"
                                aria-label={`تفاصيل الفاتورة ${invoiceDisplayNumber(invoice)}`}
                                title="تفاصيل الفاتورة"
                                onClick={() => setViewingInvoice(invoice)}
                                className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                              >
                                <Icon name="eye" size={18} />
                              </button>
                              <button
                                type="button"
                                aria-label={`دفعة ${invoiceDisplayNumber(invoice)}`}
                                title="إضافة دفعة"
                                disabled={!canAddPayment(invoice)}
                                onClick={() => setPaymentInvoice(invoice)}
                                className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Icon name="plus" size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={7}>
                          لا توجد فواتير مرتبطة بهذا الطلب حالياً.
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

      {showInvoiceForm && invoiceDraft ? (
        <InvoiceFormModal
          invoice={invoiceDraft}
          mode="create"
          lockRequest
          onClose={() => setShowInvoiceForm(false)}
          onSave={saveInvoice}
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : undefined}
        />
      ) : null}
      {activeViewingInvoiceWithPayments ? (
        <InvoiceDetailsModal
          invoice={activeViewingInvoiceWithPayments}
          onClose={() => setViewingInvoice(null)}
          onAddPayment={
            canAddPayment(activeViewingInvoiceWithPayments)
              ? () => setPaymentInvoice(activeViewingInvoiceWithPayments)
              : undefined
          }
          onDownloadPdf={downloadInvoicePdf}
          downloadingPdf={invoicePdfId === activeViewingInvoiceWithPayments.id}
        />
      ) : null}
      {paymentInvoice ? (
        <AddPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={savePayment}
          submitting={recordPayment.isPending}
          submitError={recordPayment.error ? getApiErrorMessage(recordPayment.error) : undefined}
        />
      ) : null}
    </>
  );
}
